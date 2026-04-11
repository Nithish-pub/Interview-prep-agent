"use client";

import React from "react";
import type { InterviewQuestion } from "@/lib/interview/types";
import DesignCanvas from "@/app/components/DesignCanvas";
import CodeWorkspace from "@/app/components/CodeWorkspace";

interface InterviewViewProps {
  company: string;
  questions: InterviewQuestion[];
  currentQIndex: number;
  voiceStatus: "idle" | "connecting" | "connected" | "error";
  voiceError: string | null;
  aiTranscript: string;
  userSpeaking: boolean;
  missingKey: boolean;
  loading: boolean;
  darkMode: boolean;
  timeRemaining: number | null;
  audioRef: React.RefObject<HTMLAudioElement>;
  onEnd: () => void;
  onNext: () => void;
  onPrev: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onToggleDarkMode: () => void;
}

export default function InterviewView({
  company,
  questions,
  currentQIndex,
  voiceStatus,
  voiceError,
  aiTranscript,
  userSpeaking,
  missingKey,
  loading,
  darkMode,
  timeRemaining,
  audioRef,
  onEnd,
  onNext,
  onPrev,
  onConnect,
  onDisconnect,
  onToggleDarkMode,
}: InterviewViewProps) {
  const currentQ = questions[currentQIndex];
  const total = questions.length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      <audio ref={audioRef} autoPlay playsInline className="hidden" aria-hidden="true" />

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 shrink-0">
        <div className="flex flex-col">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">Prep Agent</span>
          <span className="text-sm text-slate-400">{company} · {questions[0]?.competency ? "Interview" : ""}</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex gap-2">
            {questions.map((_, i) => (
              <span
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === currentQIndex
                    ? "bg-pink-500 scale-125 shadow-[0_0_10px_rgba(236,72,153,0.8)]"
                    : i < currentQIndex
                    ? "bg-indigo-500/50"
                    : "bg-slate-700"
                }`}
              />
            ))}
          </div>

          {/* Countdown Timer */}
          {timeRemaining !== null && (() => {
            const mins = Math.floor(timeRemaining / 60);
            const secs = timeRemaining % 60;
            const isLow = timeRemaining <= 120; // last 2 minutes
            return (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-mono font-semibold transition-colors ${
                isLow
                  ? "bg-red-500/10 border-red-500/30 text-red-400"
                  : "bg-slate-800/60 border-slate-700 text-slate-300"
              }`}>
                <svg className={`w-3.5 h-3.5 ${isLow ? "text-red-400" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
              </div>
            );
          })()}

          <button
            onClick={onToggleDarkMode}
            className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 transition-all text-slate-300 hover:text-white"
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
          <button
            className="px-4 py-2 text-sm font-semibold text-white bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 rounded-lg transition-all"
            onClick={onEnd}
          >
            End Interview
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-6 p-6">
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto">

          {/* Question Card */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
            <div className="flex justify-between items-start mb-6">
              <span className="text-sm font-bold text-slate-400 tracking-wider uppercase">
                Question {currentQIndex + 1} of {total}
              </span>
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-semibold tracking-wide">
                {currentQ.competency.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-xl md:text-2xl text-white font-medium leading-relaxed mb-6">
              {currentQ.prompt}
            </p>

            {currentQ.isDsa && (currentQ.constraints?.length || currentQ.testCases?.length) ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                {currentQ.constraints && currentQ.constraints.length > 0 && (
                  <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Constraints</span>
                    <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                      {currentQ.constraints.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}
                {currentQ.testCases && currentQ.testCases.length > 0 && (
                  <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Examples / Test Cases</span>
                    <ul className="list-none text-sm text-slate-300 space-y-2">
                      {currentQ.testCases.map((tc, i) => (
                        <li key={i} className="bg-slate-900 border border-slate-700/50 p-2 rounded block font-mono text-xs">{tc}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : <div className="mb-8" />}

            <div className="flex items-center justify-between pt-6 border-t border-slate-800/50">
              <button
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                onClick={onPrev}
                disabled={currentQIndex === 0}
              >
                ← Previous
              </button>
              <button
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                onClick={onNext}
                disabled={currentQIndex === total - 1}
              >
                Next Question →
              </button>
            </div>
          </div>

          {/* Canvas / Workspace */}
          {currentQ.isDsa ? (
            <div className="flex-1 min-h-[400px] bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden relative flex flex-col text-slate-300">
              <CodeWorkspace key={currentQ.id} question={currentQ} />
            </div>
          ) : /design|architecture|model|backend|system/i.test(currentQ.competency) ? (
            <div className="flex-1 min-h-[400px] bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden relative flex flex-col text-slate-300">
              <DesignCanvas key={currentQ.id} />
            </div>
          ) : null}
        </div>

        {/* Voice Panel */}
        <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl flex-1 flex flex-col">
            <h3 className="text-lg font-bold text-white mb-4">Voice Assistant</h3>

            <div className="flex-1 bg-slate-950/50 rounded-2xl p-4 mb-6 border border-slate-800 overflow-y-auto">
              {voiceStatus === "connected" ? (
                <div className="flex flex-col gap-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${userSpeaking ? "text-green-400" : "text-indigo-400"}`}>
                    {userSpeaking ? "🎙 You are speaking…" : "✨ Alex is listening"}
                  </span>
                  <p className="text-slate-300 text-sm leading-relaxed">{aiTranscript || "Waiting for audio..."}</p>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm text-center">
                  Connect to voice to see live transcript
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {voiceStatus === "connected" ? (
                <button
                  type="button"
                  className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 text-red-500 font-semibold rounded-xl transition-all"
                  onClick={onDisconnect}
                >
                  Disconnect Voice
                </button>
              ) : (
                <button
                  type="button"
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-pink-500/20"
                  onClick={onConnect}
                  disabled={loading || voiceStatus === "connecting" || missingKey}
                >
                  <span className="text-lg">🎙</span>{" "}
                  {voiceStatus === "connecting" ? "Connecting…" : "Join Voice Session"}
                </button>
              )}

              <div className="flex items-center justify-center gap-2 mt-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    voiceStatus === "connected"
                      ? "bg-green-500 animate-pulse"
                      : voiceStatus === "connecting"
                      ? "bg-yellow-500 animate-bounce"
                      : voiceStatus === "error"
                      ? "bg-red-500"
                      : "bg-slate-600"
                  }`}
                />
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                  {voiceStatus === "connected"
                    ? "Live session active"
                    : voiceStatus === "connecting"
                    ? "Establishing connection"
                    : voiceStatus === "error"
                    ? "Connection failed"
                    : "Ready to connect"}
                </span>
              </div>

              {missingKey && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <span className="text-xs text-red-400 block text-center">
                    Set OPENAI_API_KEY in .env.local to enable voice.
                  </span>
                </div>
              )}
              {voiceError && (
                <p className="text-xs text-red-400 mt-2 text-center">{voiceError}</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
