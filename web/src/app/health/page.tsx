"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { emitSecure, socket } from "@/socket";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import Link from "next/link";

export default function HealthPage() {
  const { user } = useUser();
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleError = (msg: any) => console.error("Socket error:", msg);
    const handleVerified = () => setIsVerified(true);
    const handleStats = (data: any) => {
      setLastUpdate(new Date().toLocaleTimeString());
      setStats(data);
      setHistory((prev) => {
        const newHistory = [
          ...prev,
          {
            time: new Date().toLocaleTimeString().split(' ')[0],
            cpu: parseFloat(data.cpu),
            mem: parseFloat(data.memUsed),
          },
        ];
        if (newHistory.length > 20) return newHistory.slice(1);
        return newHistory;
      });
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleError);
    socket.on("error", handleError);
    socket.on("owner-verified", handleVerified);
    socket.on("sys-stats", handleStats);

    if (socket.connected) setIsConnected(true);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleError);
      socket.off("error", handleError);
      socket.off("owner-verified", handleVerified);
      socket.off("sys-stats", handleStats);
    };
  }, []);

  useEffect(() => {
    userIdRef.current = user?.id || null;
    if (!userIdRef.current || !isConnected) return;
    emitSecure("verify-owner", { userId: userIdRef.current });
    const retry = setInterval(() => {
      if (!lastUpdate && userIdRef.current) {
        emitSecure("verify-owner", { userId: userIdRef.current });
      }
    }, 2000);
    return () => clearInterval(retry);
  }, [user, isConnected, lastUpdate]);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 p-8 font-sans selection:bg-orange-100">
      {/* Header: Refined & Professional */}
      <div className="flex justify-between items-start mb-16 border-b border-stone-200 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center text-white font-black italic shadow-lg shadow-stone-200">N</div>
            <h1 className="text-3xl font-black text-stone-900 tracking-tighter uppercase leading-none">
              Telemetry <span className="text-orange-600">Health</span>
            </h1>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-white border border-stone-200 rounded-full shadow-sm">
                <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                    {isConnected ? "Linked" : "Offline"}
                </span>
            </div>
            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                Owner: {isVerified ? "Authorized" : "Unauthorized"} • Refresh: {lastUpdate || "Pending"}
            </p>
          </div>
        </div>
        <Link
          href="/"
          className="px-8 py-3 bg-stone-900 text-white hover:bg-black transition-all text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-stone-200 border border-stone-800"
        >
          Exit Hub
        </Link>
      </div>

      {/* Main Grid: Clean & Spaced */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* CPU Chart Card */}
        <div className="bg-white border border-stone-200 p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-stone-200/50 transition-all group">
          <div className="flex justify-between items-start mb-8">
            <div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em] mb-1">Processing Unit</p>
                <h3 className="text-stone-900 text-xl font-black uppercase italic">CPU Load</h3>
            </div>
            <div className="text-right">
                <span className="text-5xl font-black text-stone-900 tracking-tighter leading-none">
                    {stats?.cpu || 0}<span className="text-orange-600 text-2xl">%</span>
                </span>
            </div>
          </div>
          
          <div className="h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="time" hide />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a8a29e' }} />
                <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                />
                <Area
                  type="stepAfter"
                  dataKey="cpu"
                  stroke="#ea580c"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorCpu)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RAM Chart Card */}
        <div className="bg-white border border-stone-200 p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-stone-200/50 transition-all group">
          <div className="flex justify-between items-start mb-8">
            <div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em] mb-1">Volatile Memory</p>
                <h3 className="text-stone-900 text-xl font-black uppercase italic">RAM Usage</h3>
            </div>
            <div className="text-right">
                <span className="text-5xl font-black text-stone-900 tracking-tighter leading-none">
                    {stats?.memUsed || 0}<span className="text-blue-600 text-2xl">GB</span>
                </span>
            </div>
          </div>
          
          <div className="h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="time" hide />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a8a29e' }} />
                <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                />
                <Area
                  type="monotone"
                  dataKey="mem"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorMem)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* OS Details Footer: Minimalist Data Grid */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <p className="text-[9px] text-stone-400 font-black uppercase tracking-widest mb-1">Platform</p>
          <p className="text-sm font-black text-stone-800 italic uppercase">{stats?.platform || "SYSTEM_SCAN..."}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <p className="text-[9px] text-stone-400 font-black uppercase tracking-widest mb-1">Kernel/Distro</p>
          <p className="text-sm font-black text-stone-800 italic uppercase">{stats?.distro || "DETECTING..."}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <p className="text-[9px] text-stone-400 font-black uppercase tracking-widest mb-1">Capacity</p>
          <p className="text-sm font-black text-stone-800 italic uppercase">{stats?.memTotal || 0} GB Physical</p>
        </div>
        <div className="bg-orange-600 p-6 rounded-2xl shadow-lg shadow-orange-200 flex flex-col justify-center">
          <p className="text-[9px] text-white/70 font-black uppercase tracking-widest mb-1">System Status</p>
          <p className="text-sm font-black text-white italic uppercase">{isConnected ? "Operational" : "Link Error"}</p>
        </div>
      </div>

      {/* Bottom Visual Element */}
      <div className="mt-12 text-center">
        <p className="text-[8px] text-stone-300 font-bold uppercase tracking-[0.8em]">End of Transmission</p>
      </div>
    </div>
  );
}