import React from "react";

export default function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="animate-pulse rounded-2xl border border-white/10 bg-slate-900/70 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-800" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 rounded bg-slate-800" />
              <div className="h-3 w-2/3 rounded bg-slate-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
