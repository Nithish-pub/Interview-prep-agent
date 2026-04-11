"use client";

import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

export default function DesignCanvas() {
  return (
    <div className="flex flex-col flex-1 w-full h-full bg-slate-900 rounded-2xl overflow-hidden shadow-inner shadow-slate-950/50">
      <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex justify-between items-center shrink-0">
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-slate-200">System Design Canvas</span>
          <span className="text-xs text-slate-400">
            Draw your architecture, data flows, and infrastructure scaling using the tools below.
          </span>
        </div>
      </div>
      <div className="flex-1 w-full relative bg-[#121212]">
        <Tldraw autoFocus={false} />
      </div>
    </div>
  );
}
