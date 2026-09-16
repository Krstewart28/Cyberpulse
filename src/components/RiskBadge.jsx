import React from "react";
import { cn } from "@/lib/utils";

const CATEGORY_STYLES = {
  Low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  Medium: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  High: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  Critical: "text-rose-400 bg-rose-500/10 border-rose-500/30",
};

export default function RiskBadge({ score, category, className }) {
  const cat = category || (score >= 75 ? "Critical" : score >= 50 ? "High" : score >= 25 ? "Medium" : "Low");
  return (
    <div className={cn("inline-flex items-center gap-2 rounded-md border px-2.5 py-1", CATEGORY_STYLES[cat], className)}>
      <span className="text-sm font-semibold tabular-nums">{score}</span>
      <span className="text-[10px] uppercase tracking-wide opacity-80">{cat}</span>
    </div>
  );
}