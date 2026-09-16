import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Pause, RotateCcw, Activity, ShieldAlert, CheckCircle2, XCircle, Cpu, Clock, Zap } from "lucide-react";
import { useSimulation } from "@/lib/simulation/SimulationContext";
import { cn } from "@/lib/utils";

export default function Simulation() {
  const { running, start, stop, reset, stats, simTime, events, seeding, triggerAttackDemo } = useSimulation();
  const navigate = useNavigate();
  const [demoResult, setDemoResult] = useState(null);

  const runDemo = () => {
    const created = triggerAttackDemo();
    setDemoResult(created.length ? { id: created[0].alert_id } : { throttled: true });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Simulation Control</h2>
        <p className="text-xs text-slate-500">Drives the synthetic event pipeline: generate → validate → detect → correlate → score → persist.</p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn("rounded-lg p-3", running ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-500")}>
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{running ? "Running" : seeding ? "Seeding database…" : "Idle"}</p>
              <p className="text-xs text-slate-500">Simulated time: {new Date(simTime).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {!running ? (
              <button disabled={seeding} onClick={start} className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400 disabled:opacity-50">
                <Play className="h-4 w-4" /> Start Simulation
              </button>
            ) : (
              <button onClick={stop} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700">
                <Pause className="h-4 w-4" /> Pause
              </button>
            )}
            <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
            <button onClick={runDemo} className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300 hover:bg-cyan-500/20">
              <Zap className="h-4 w-4" /> Run Attack Demo
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric icon={Activity} label="Events Generated" value={stats.eventsGenerated} color="text-cyan-300" />
          <Metric icon={CheckCircle2} label="Events Processed" value={stats.eventsProcessed} color="text-emerald-300" />
          <Metric icon={XCircle} label="Events Rejected" value={stats.eventsRejected} color="text-rose-300" />
          <Metric icon={ShieldAlert} label="Alerts Generated" value={stats.alertsGenerated} color="text-amber-300" />
        </div>

        {demoResult && !demoResult.throttled && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-sm text-slate-300">
            <Zap className="h-4 w-4 shrink-0 text-rose-400" />
            <span>Brute-force scenario injected: 4 failed logins correlated with a successful login →</span>
            <button onClick={() => navigate(`/alerts/${demoResult.id}`)} className="font-mono text-cyan-300 underline hover:text-cyan-200">{demoResult.id}</button>
          </div>
        )}
        {demoResult && demoResult.throttled && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/40 px-4 py-3 text-sm text-slate-400">
            <Zap className="h-4 w-4 shrink-0 text-slate-500" />
            <span>Scenario injected, but rule R001 was throttled — an open alert for this user already exists within the throttle window.</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><Clock className="h-4 w-4 text-cyan-400" /> Pipeline Status</h3>
          <ul className="space-y-2 text-sm">
            <PipelineStep done={stats.eventsGenerated > 0} label="Synthetic event generation" />
            <PipelineStep done={stats.eventsProcessed > 0} label="Event validation" />
            <PipelineStep done={stats.eventsProcessed > 0} label="Detection rules engine" />
            <PipelineStep done={stats.alertsGenerated > 0} label="Event correlation" />
            <PipelineStep done={stats.alertsGenerated > 0} label="Explainable risk scoring" />
            <PipelineStep done={stats.alertsGenerated > 0} label="Alert persistence (PostgreSQL)" />
          </ul>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><Activity className="h-4 w-4 text-cyan-400" /> Live Event Feed</h3>
          <div className="max-h-72 space-y-1.5 overflow-auto">
            {events.length === 0 && <p className="text-sm text-slate-500">No events yet. Start the simulation.</p>}
            {events.slice(0, 30).map((e) => (
              <div key={e.event_id} className="flex items-center gap-2 rounded-md bg-slate-950/40 px-2.5 py-1.5 text-xs">
                <span className="font-mono text-slate-500">{new Date(e.timestamp).toLocaleTimeString()}</span>
                <span className={cn("font-mono", e.is_valid ? "text-slate-300" : "text-rose-400")}>{e.event_type}</span>
                <span className="truncate text-slate-400">{e.user_name}</span>
                <span className="ml-auto truncate text-slate-500">{e.application}</span>
                {e.alert_id && <ShieldAlert className="h-3 w-3 text-rose-400" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4" />
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className={cn("mt-1.5 text-2xl font-semibold tabular-nums", color)}>{value}</p>
    </div>
  );
}

function PipelineStep({ done, label }) {
  return (
    <li className="flex items-center gap-2">
      <span className={cn("flex h-5 w-5 items-center justify-center rounded-full text-[10px]", done ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-600")}>
        {done ? "✓" : "•"}
      </span>
      <span className={done ? "text-slate-200" : "text-slate-500"}>{label}</span>
    </li>
  );
}