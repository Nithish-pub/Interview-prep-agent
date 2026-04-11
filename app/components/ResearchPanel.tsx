"use client";

import type { ResearchReport } from "@/lib/interview/types";

interface ResearchPanelProps {
  report: ResearchReport;
  company: string;
  role: string;
}

export default function ResearchPanel({ report, company, role }: ResearchPanelProps) {
  const topTopics = Object.entries(report.topicFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const previewQuestions = report.realQuestions.slice(0, 5);

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h3 className="text-white font-semibold text-lg">Research Complete</h3>
          <p className="text-slate-400 text-sm">
            Found real interview data for {company} {role}
          </p>
        </div>
      </div>

      {/* Round Structure */}
      {report.companyRoundStructure && (
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Round Structure</p>
          <div className="bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 text-sm leading-relaxed">
            {report.companyRoundStructure}
          </div>
        </div>
      )}

      {/* Real Questions */}
      {previewQuestions.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
            Real Questions Found ({report.realQuestions.length} total)
          </p>
          <ul className="flex flex-col gap-2">
            {previewQuestions.map((q, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-300">
                <span className="text-emerald-500 font-bold flex-shrink-0 mt-0.5">{i + 1}.</span>
                <span className="leading-relaxed">{q}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Topic Pills */}
      {topTopics.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Top Topics</p>
          <div className="flex flex-wrap gap-2">
            {topTopics.map(([topic, count]) => (
              <span
                key={topic}
                className="inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium px-3 py-1 rounded-full"
              >
                {topic}
                <span className="text-indigo-500 font-bold">×{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sources count */}
      {report.sources.length > 0 && (
        <p className="text-xs text-slate-500 mb-6">
          Sourced from {report.sources.length} community report{report.sources.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Generating spinner */}
      <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
        <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
        <span className="text-slate-300 text-sm animate-pulse">Generating your personalised plan...</span>
      </div>
    </div>
  );
}
