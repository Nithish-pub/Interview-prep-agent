"use client";

import type { InterviewMode, DifficultyLevel, TimeLimit, ResearchReport } from "@/lib/interview/types";
import ResearchPanel from "@/app/components/ResearchPanel";

const INTERVIEW_MODES: InterviewMode[] = ["behavioral", "technical", "mixed"];

interface SetupViewProps {
  company: string;
  setCompany: (v: string) => void;
  role: string;
  setRole: (v: string) => void;
  jobDescription: string;
  setJobDescription: (v: string) => void;
  candidateFocus: string;
  setCandidateFocus: (v: string) => void;
  mode: InterviewMode;
  setMode: (v: InterviewMode) => void;
  difficulty: DifficultyLevel;
  setDifficulty: (v: DifficultyLevel) => void;
  timeLimit: TimeLimit;
  setTimeLimit: (v: TimeLimit) => void;
  loading: boolean;
  loadingPhase: "idle" | "researching" | "generating";
  researchReport: ResearchReport | null;
  showResearchPanel: boolean;
  startError: string | null;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onStart: () => void;
}

export default function SetupView({
  company, setCompany,
  role, setRole,
  jobDescription, setJobDescription,
  candidateFocus, setCandidateFocus,
  mode, setMode,
  difficulty, setDifficulty,
  timeLimit, setTimeLimit,
  loading,
  loadingPhase,
  researchReport,
  showResearchPanel,
  startError,
  darkMode,
  onToggleDarkMode,
  onStart,
}: SetupViewProps) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background glowing blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-pink-500/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Dark mode toggle */}
      <button
        onClick={onToggleDarkMode}
        className="absolute top-6 right-6 z-20 p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 transition-all text-slate-300 hover:text-white"
        aria-label="Toggle dark mode"
        title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        {darkMode ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
          </svg>
        )}
      </button>

      <section className="text-center max-w-2xl mb-12 relative z-10">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
          Prep Agent
        </h1>
        <p className="text-slate-400 text-lg">
          Fill in your details and focus area, then generate a tailored interview
          plan to start a live voice session.
        </p>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl w-full relative z-10">
        {/* Form Panel */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-pink-500" />
          <h2 className="text-2xl font-bold mb-6 text-white">Set Up Your Interview</h2>

          <div className="flex flex-col gap-2 mb-5">
            <label htmlFor="company" className="text-sm font-medium text-slate-300">Company</label>
            <input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="bg-slate-950/50 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none transition-all ring-1 ring-transparent focus:ring-indigo-500/30 text-white"
            />
          </div>

          <div className="flex flex-col gap-2 mb-5">
            <label htmlFor="role" className="text-sm font-medium text-slate-300">Role</label>
            <input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="bg-slate-950/50 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none transition-all ring-1 ring-transparent focus:ring-indigo-500/30 text-white"
            />
          </div>

          <div className="flex flex-col gap-2 mb-5">
            <label htmlFor="mode" className="text-sm font-medium text-slate-300">Mode</label>
            <select
              id="mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as InterviewMode)}
              className="bg-slate-950/50 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none transition-all ring-1 ring-transparent focus:ring-indigo-500/30 text-white appearance-none"
            >
              {INTERVIEW_MODES.map((m) => (
                <option key={m} value={m} className="bg-slate-900">
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty + Time Limit side by side */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="difficulty" className="text-sm font-medium text-slate-300">Difficulty</label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                className="bg-slate-950/50 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none transition-all ring-1 ring-transparent focus:ring-indigo-500/30 text-white appearance-none"
              >
                <option value="easy" className="bg-slate-900">Easy</option>
                <option value="medium" className="bg-slate-900">Medium</option>
                <option value="hard" className="bg-slate-900">Hard</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="timeLimit" className="text-sm font-medium text-slate-300">Duration</label>
              <select
                id="timeLimit"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value) as TimeLimit)}
                className="bg-slate-950/50 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none transition-all ring-1 ring-transparent focus:ring-indigo-500/30 text-white appearance-none"
              >
                <option value={15} className="bg-slate-900">15 min</option>
                <option value={30} className="bg-slate-900">30 min</option>
                <option value={45} className="bg-slate-900">45 min</option>
                <option value={60} className="bg-slate-900">60 min</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2 mb-5">
            <label htmlFor="jobDescription" className="text-sm font-medium text-slate-300">Job Description</label>
            <textarea
              id="jobDescription"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={3}
              className="bg-slate-950/50 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none transition-all ring-1 ring-transparent focus:ring-indigo-500/30 text-white resize-none"
            />
          </div>

          <div className="flex flex-col gap-2 mb-8">
            <label htmlFor="candidateFocus" className="text-sm font-medium text-slate-300">Candidate Focus</label>
            <textarea
              id="candidateFocus"
              value={candidateFocus}
              onChange={(e) => setCandidateFocus(e.target.value)}
              rows={2}
              placeholder="e.g. Focus on system design, API design, ownership..."
              className="bg-slate-950/50 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none transition-all ring-1 ring-transparent focus:ring-indigo-500/30 text-white resize-none placeholder:text-slate-600"
            />
          </div>

          {startError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 text-center">
              {startError}
            </div>
          )}

          <button
            onClick={onStart}
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl shadow-lg shadow-pink-500/20 transition-all text-lg flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <span className="animate-pulse">
                {loadingPhase === "researching"
                  ? "Researching interview patterns..."
                  : "Generating your plan..."}
              </span>
            ) : (
              <>
                Generate Interview Plan
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </>
            )}
          </button>
        </div>

        {/* Info Panel — replaced by ResearchPanel when research is ready */}
        {showResearchPanel && researchReport ? (
          <ResearchPanel report={researchReport} company={company} role={role} />
        ) : (
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold mb-8 text-white">How it works</h2>

          <div className="flex flex-col gap-8">
            <div className="flex gap-5 items-start">
              <div className="bg-indigo-500/20 text-indigo-400 w-10 h-10 flex items-center justify-center rounded-full font-bold flex-shrink-0 border border-indigo-500/30">
                1
              </div>
              <div>
                <strong className="block text-lg text-white mb-1">Set your focus</strong>
                <span className="text-slate-400 leading-relaxed">Tell us the company, role, and what areas you want to be tested on — system design, behavioral, technical depth, or a mix.</span>
              </div>
            </div>

            <div className="flex gap-5 items-start">
              <div className="bg-pink-500/20 text-pink-400 w-10 h-10 flex items-center justify-center rounded-full font-bold flex-shrink-0 border border-pink-500/30">
                2
              </div>
              <div>
                <strong className="block text-lg text-white mb-1">Generate a plan</strong>
                <span className="text-slate-400 leading-relaxed">We build a set of targeted, role-specific questions. System design questions come with a live canvas; technical questions come with a code editor.</span>
              </div>
            </div>

            <div className="flex gap-5 items-start">
              <div className="bg-blue-500/20 text-blue-400 w-10 h-10 flex items-center justify-center rounded-full font-bold flex-shrink-0 border border-blue-500/30">
                3
              </div>
              <div>
                <strong className="block text-lg text-white mb-1">Enter the interview</strong>
                <span className="text-slate-400 leading-relaxed">One question at a time. Join voice to talk with Alex, your AI interviewer. Alex probes, follows up, and moves on when you're ready.</span>
              </div>
            </div>
          </div>
        </div>
        )}
      </section>
    </main>
  );
}
