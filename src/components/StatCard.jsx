import React from "react";
import { cn } from "@/lib/utils";

export default function StatCard({ label, value, icon: Icon, accent = "text-slate-200", sub }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
          <p className={cn("mt-2 text-2xl font-semibold tabular-nums", accent)}>{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
        </div>
        {Icon && (
          <div className="rounded-lg border border-slate-800 bg-slate-800/50 p-2 text-slate-400">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}