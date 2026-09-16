import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Activity, ShieldAlert, ListFilter, ScrollText, Cpu, ShieldCheck, Play, Pause, RotateCcw } from "lucide-react";
import { useSimulation } from "@/lib/simulation/SimulationContext";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: Activity, end: true },
  { to: "/events", label: "Security Events", icon: ListFilter },
  { to: "/alerts", label: "Alerts", icon: ShieldAlert },
  { to: "/rules", label: "Detection Rules", icon: ScrollText },
  { to: "/simulation", label: "Simulation", icon: Cpu },
];

export default function Layout() {
  const { running, start, stop, reset, stats } = useSimulation();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-800 bg-slate-900/80 backdrop-blur md:flex">
        <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-5">
          <div className="rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 p-2">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-white">CyberPulse</p>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">SOC Platform</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-4">
          <div className="mb-3 flex items-center gap-2 text-xs">
            <span className={cn("h-2 w-2 rounded-full", running ? "bg-emerald-400 animate-pulse" : "bg-slate-600")} />
            <span className="text-slate-400">{running ? "Simulation running" : "Simulation idle"}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-md bg-slate-800/50 px-2 py-1.5">
              <p className="text-[10px] uppercase text-slate-500">Events</p>
              <p className="text-sm font-semibold tabular-nums text-slate-200">{stats.eventsGenerated}</p>
            </div>
            <div className="rounded-md bg-slate-800/50 px-2 py-1.5">
              <p className="text-[10px] uppercase text-slate-500">Alerts</p>
              <p className="text-sm font-semibold tabular-nums text-slate-200">{stats.alertsGenerated}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-cyan-400" />
          <span className="font-semibold text-white">CyberPulse</span>
        </div>
        <div className="flex gap-1">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => cn("rounded-md p-1.5", isActive ? "text-cyan-300" : "text-slate-400")}>
              <item.icon className="h-4 w-4" />
            </NavLink>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="md:pl-60">
        <header className="hidden items-center justify-between border-b border-slate-800 px-8 py-4 md:flex">
          <div>
            <h1 className="text-lg font-semibold text-white">Security Operations Center</h1>
            <p className="text-xs text-slate-500">Enterprise Cybersecurity & Risk Intelligence</p>
          </div>
          <div className="flex items-center gap-2">
            {!running ? (
              <button onClick={start} className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-cyan-400">
                <Play className="h-4 w-4" /> Start
              </button>
            ) : (
              <button onClick={stop} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-700">
                <Pause className="h-4 w-4" /> Pause
              </button>
            )}
            <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800">
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          </div>
        </header>
        <main className="px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}