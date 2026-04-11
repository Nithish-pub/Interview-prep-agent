"use client";

import { useState, useEffect, useRef, useCallback, KeyboardEvent } from "react";
import type { InterviewQuestion, StarterResponse } from "@/lib/interview/types";

const LANGUAGES = [
  { label: "Python", id: "python", version: "3.10.0" },
  { label: "JavaScript", id: "javascript", version: "18.15.0" },
  { label: "Java", id: "java", version: "15.0.2" },
  { label: "C++", id: "c++", version: "10.2.0" },
];

// Module-level cache keyed by "questionId:langId"
const starterCache = new Map<string, StarterResponse>();

interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

interface CodeWorkspaceProps {
  question?: InterviewQuestion;
}

function lineCount(s: string) {
  return s ? s.split("\n").length : 0;
}

interface TestResult {
  passed: boolean;
  label: string;
}

interface ParsedResults {
  tests: TestResult[];
  passed: number;
  total: number;
  hasResults: boolean;
}

function parseTestResults(stdout: string): ParsedResults {
  const lines = stdout.split("\n").map((l) => l.trim()).filter(Boolean);
  const tests: TestResult[] = [];

  for (const line of lines) {
    if (line.startsWith("[PASS]")) {
      tests.push({ passed: true, label: line.replace("[PASS]", "").trim() });
    } else if (line.startsWith("[FAIL]")) {
      tests.push({ passed: false, label: line.replace("[FAIL]", "").trim() });
    }
  }

  const passed = tests.filter((t) => t.passed).length;
  return { tests, passed, total: tests.length, hasResults: tests.length > 0 };
}

export default function CodeWorkspace({ question }: CodeWorkspaceProps) {
  const [langIndex, setLangIndex] = useState(0);

  // The three parts of the code
  const [prefix, setPrefix] = useState("");
  const [editable, setEditable] = useState("// Loading starter code...");
  const [suffix, setSuffix] = useState("");

  const [loadingStarter, setLoadingStarter] = useState(false);
  const [formattingCode, setFormattingCode] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const lang = LANGUAGES[langIndex];

  async function fetchStarter(langId: string) {
    if (!question) return;
    const cacheKey = `${question.id}:${langId}`;

    if (starterCache.has(cacheKey)) {
      const cached = starterCache.get(cacheKey)!;
      setPrefix(cached.prefix);
      setEditable(cached.editable);
      setSuffix(cached.suffix);
      return;
    }

    setLoadingStarter(true);
    setPrefix("");
    setEditable("// Loading starter code...");
    setSuffix("");

    try {
      const res = await fetch("/api/starter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: question.prompt,
          language: langId,
          testCases: question.testCases ?? [],
        }),
      });
      const data = (await res.json()) as StarterResponse;
      starterCache.set(cacheKey, data);
      setPrefix(data.prefix);
      setEditable(data.editable);
      setSuffix(data.suffix);
    } finally {
      setLoadingStarter(false);
    }
  }

  useEffect(() => {
    void fetchStarter(lang.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLangChange(idx: number) {
    setLangIndex(idx);
    setResult(null);
    void fetchStarter(LANGUAGES[idx].id);
  }

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const el = e.currentTarget;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const next = editable.slice(0, start) + "    " + editable.slice(end);
        setEditable(next);
        requestAnimationFrame(() => {
          el.selectionStart = el.selectionEnd = start + 4;
        });
      }
    },
    [editable]
  );

  async function formatCode() {
    setFormattingCode(true);
    try {
      const res = await fetch("/api/format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: editable, language: lang.id }),
      });
      const data = (await res.json()) as { code: string };
      setEditable(data.code);
    } finally {
      setFormattingCode(false);
    }
  }

  async function runCode() {
    setRunning(true);
    setResult(null);
    // Concatenate all three parts for execution
    const fullCode = prefix + editable + suffix;
    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: lang.id,
          version: lang.version,
          files: [{ content: fullCode }],
        }),
      });

      const data = (await response.json()) as {
        run?: { stdout?: string; stderr?: string; code?: number };
        message?: string;
      };

      if (data.run) {
        setResult({
          stdout: data.run.stdout ?? "",
          stderr: data.run.stderr ?? "",
          exitCode: data.run.code ?? 0,
        });
      } else {
        setResult({
          stdout: "",
          stderr: data.message ?? "Unknown error",
          exitCode: 1,
        });
      }
    } catch (err) {
      setResult({
        stdout: "",
        stderr:
          err instanceof Error ? err.message : "Failed to reach code runner.",
        exitCode: 1,
      });
    } finally {
      setRunning(false);
    }
  }

  const prefixLines = lineCount(prefix);
  const suffixLines = lineCount(suffix);

  return (
    <div className="flex flex-col h-full flex-1 w-full bg-slate-900 rounded-2xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between p-3 border-b border-slate-800 bg-slate-900/80 shrink-0 gap-3">
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((l, i) => (
            <button
              key={l.id}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                i === langIndex
                  ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
              onClick={() => handleLangChange(i)}
            >
              {l.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {loadingStarter && (
            <span className="text-xs text-slate-500 animate-pulse">
              Generating…
            </span>
          )}
          <button
            onClick={formatCode}
            disabled={formattingCode || loadingStarter || running}
            className="flex items-center gap-1.5 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
            title="Format code"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h7" />
            </svg>
            {formattingCode ? "Formatting…" : "Format"}
          </button>
          <button
            className="flex items-center gap-2 px-5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold rounded-lg border border-emerald-500/20 transition-all disabled:opacity-50 text-sm"
            onClick={runCode}
            disabled={running || loadingStarter}
          >
            {running ? "Running…" : "▶ Run Code"}
          </button>
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 flex flex-col bg-[#0d1117] min-h-[300px] overflow-hidden">
        {/* Hidden prefix banner */}
        {prefix && (
          <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-800/40 border-b border-slate-700/50 shrink-0 select-none">
            <div className="flex-1 h-px bg-slate-700/60" />
            <span className="text-xs text-slate-500 font-mono whitespace-nowrap">
              {prefixLines} line{prefixLines !== 1 ? "s" : ""} hidden
            </span>
            <div className="flex-1 h-px bg-slate-700/60" />
          </div>
        )}

        {/* Editable textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            className="absolute inset-0 w-full h-full bg-transparent text-slate-300 font-mono text-sm leading-relaxed p-4 outline-none resize-none"
            value={editable}
            onChange={(e) => setEditable(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>

        {/* Hidden suffix banner */}
        {suffix && (
          <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-800/40 border-t border-slate-700/50 shrink-0 select-none">
            <div className="flex-1 h-px bg-slate-700/60" />
            <span className="text-xs text-slate-500 font-mono whitespace-nowrap">
              {suffixLines} line{suffixLines !== 1 ? "s" : ""} hidden
            </span>
            <div className="flex-1 h-px bg-slate-700/60" />
          </div>
        )}
      </div>

      {/* Output Panel */}
      <div className="h-1/3 min-h-[180px] max-h-[320px] border-t border-slate-800 bg-slate-900 flex flex-col shrink-0">
        <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Test Results
          </span>
          {result && (() => {
            const tr = parseTestResults(result.stdout);
            if (!tr.hasResults) return null;
            const allPass = tr.passed === tr.total;
            return (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${allPass ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                {tr.passed}/{tr.total} passed
              </span>
            );
          })()}
        </div>
        <div className="flex-1 overflow-y-auto p-3 bg-black/40 flex flex-col gap-1.5">
          {!result ? (
            <p className="text-slate-600 italic text-sm m-auto">Run your code to see test results…</p>
          ) : (() => {
            const tr = parseTestResults(result.stdout);

            // Compilation / runtime error — show raw stderr
            if (result.stderr && !tr.hasResults) {
              return (
                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                  <p className="text-xs font-semibold text-red-400 mb-1 uppercase tracking-wider">Error</p>
                  <pre className="text-red-300 whitespace-pre-wrap text-xs leading-relaxed">{result.stderr}</pre>
                </div>
              );
            }

            if (!tr.hasResults) {
              return (
                <pre className="text-slate-400 whitespace-pre-wrap text-xs p-2">
                  {result.stdout || result.stderr || "Process completed with no output."}
                </pre>
              );
            }

            return (
              <>
                {tr.tests.map((t, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2.5 px-3 py-2 rounded-lg text-sm font-mono ${
                      t.passed
                        ? "bg-emerald-500/10 border border-emerald-500/20"
                        : "bg-red-500/10 border border-red-500/20"
                    }`}
                  >
                    <span className={`shrink-0 font-bold ${t.passed ? "text-emerald-400" : "text-red-400"}`}>
                      {t.passed ? "✓" : "✗"}
                    </span>
                    <span className={t.passed ? "text-emerald-300" : "text-red-300"}>
                      {t.label}
                    </span>
                  </div>
                ))}
                {result.stderr && (
                  <details className="mt-1">
                    <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400 px-1">Show stderr</summary>
                    <pre className="text-red-400 whitespace-pre-wrap text-xs mt-1 p-2">{result.stderr}</pre>
                  </details>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
