"use client";

import { useState, useRef, useCallback, KeyboardEvent } from "react";

const LANGUAGES = [
  { label: "Python", id: "python", version: "3.10.0" },
  { label: "JavaScript", id: "javascript", version: "18.15.0" },
  { label: "Java", id: "java", version: "15.0.2" },
  { label: "C++", id: "c++", version: "10.2.0" }
];

const STARTERS: Record<string, string> = {
  python: `# Write your solution here\n\ndef solve():\n    pass\n\nprint(solve())`,
  javascript: `// Write your solution here\n\nfunction solve() {\n\n}\n\nconsole.log(solve());`,
  java: `// Write your solution here\npublic class Solution {\n    public static void main(String[] args) {\n        \n    }\n}`,
  "c++": `// Write your solution here\n#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}`
};

interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export default function CodeWorkspace() {
  const [langIndex, setLangIndex] = useState(0);
  const [code, setCode] = useState(STARTERS["python"]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const lang = LANGUAGES[langIndex];

  function handleLangChange(idx: number) {
    setLangIndex(idx);
    setCode(STARTERS[LANGUAGES[idx].id]);
    setResult(null);
  }

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const next = code.slice(0, start) + "    " + code.slice(end);
      setCode(next);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 4;
      });
    }
  }, [code]);

  async function runCode() {
    setRunning(true);
    setResult(null);
    try {
      const response = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: lang.id,
          version: lang.version,
          files: [{ content: code }]
        })
      });

      const data = await response.json() as {
        run?: { stdout?: string; stderr?: string; code?: number };
        message?: string;
      };

      if (data.run) {
        setResult({
          stdout: data.run.stdout ?? "",
          stderr: data.run.stderr ?? "",
          exitCode: data.run.code ?? 0
        });
      } else {
        setResult({ stdout: "", stderr: data.message ?? "Unknown error", exitCode: 1 });
      }
    } catch (err) {
      setResult({
        stdout: "",
        stderr: err instanceof Error ? err.message : "Failed to reach code runner.",
        exitCode: 1
      });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="codeWorkspace">
      <div className="codeToolbar">
        <div className="langTabs">
          {LANGUAGES.map((l, i) => (
            <button
              key={l.id}
              className={`langTab ${i === langIndex ? "active" : ""}`}
              onClick={() => handleLangChange(i)}
            >
              {l.label}
            </button>
          ))}
        </div>
        <button className="button runBtn" onClick={runCode} disabled={running}>
          {running ? "Running…" : "▶ Run"}
        </button>
      </div>

      <div className="editorWrap">
        <textarea
          ref={textareaRef}
          className="codeTextarea"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          rows={16}
        />
      </div>

      <div className="outputPanel">
        <span className="outputLabel">Output</span>
        {!result ? (
          <p className="outputEmpty">Run your code to see output here.</p>
        ) : (
          <div className={`outputContent ${result.exitCode !== 0 ? "error" : ""}`}>
            {result.stdout && <pre>{result.stdout}</pre>}
            {result.stderr && <pre className="stderr">{result.stderr}</pre>}
            {!result.stdout && !result.stderr && (
              <p className="outputEmpty">No output.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
