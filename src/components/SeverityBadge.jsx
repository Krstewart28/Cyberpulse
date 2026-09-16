import React from "react";
import { cn } from "@/lib/utils";

const STYLES = {
  Low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  Medium: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  High: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  Critical: "bg-rose-500/10 text-rose-400 border-rose-500/30",
};

export default function SeverityBadge({ severity, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        STYLES[severity] || STYLES.Low,
        className
      )}
    >
      {severity}
    </span>
  );
}