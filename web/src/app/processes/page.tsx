"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { emitSecure, socket } from "@/socket";
import { toast } from "sonner";
import Link from "next/link";

type Proc = {
  pid: number;
  name: string;
  cpu: number;
  mem: number;
};

export default function ProcessesPage() {
  const { user } = useUser();
  const [processes, setProcesses] = useState<Proc[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [confirmPid, setConfirmPid] = useState<number | null>(null);
  const [confirmName, setConfirmName] = useState<string>("");
  const [lockdown, setLockdown] = useState(false);
  const ownerId = process.env.NEXT_PUBLIC_OWNER_ID;
  const isOwner = !ownerId || user?.id === ownerId;

  const refresh = () => {
    emitSecure("get-processes", {});
  };

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      if (user) {
        emitSecure("verify-owner", { userId: user.id });
      }
    };
    const handleDisconnect = () => setIsConnected(false);
    const handleList = (list: Proc[]) => setProcesses(list);
    const handleKilled = (res: { success: boolean; pid: number; error?: string }) => {
      if (!res.success) {
        toast.error("Process Termination Denied");
      } else {
        toast.success(`PID ${res.pid} terminated`);
        refresh();
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("process-list", handleList);
    socket.on("process-killed", handleKilled);

    if (socket.connected) handleConnect();

    const interval = setInterval(refresh, 5000);
    refresh();

    return () => {
      clearInterval(interval);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("process-list", handleList);
      socket.off("process-killed", handleKilled);
    };
  }, [user]);

  useEffect(() => {
    const saved = localStorage.getItem("nexus_lockdown");
    setLockdown(saved === "true");
  }, []);

  if (user && !isOwner) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-8">
        <div className="text-center">
            <h1 className="text-8xl font-black text-stone-200 mb-4 tracking-tighter">403</h1>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.5em]">Identity Not Verified</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 p-8 font-sans selection:bg-orange-100">
      
      {/* Header Section */}
      <div className="flex justify-between items-end mb-12 border-b border-stone-200 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center text-white font-black italic shadow-lg">N</div>
            <h1 className="text-3xl font-black text-stone-900 tracking-tighter uppercase leading-none">
              Task <span className="text-orange-600">Manager</span>
            </h1>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className={`flex items-center gap-2 px-3 py-1 bg-white border border-stone-200 rounded-full shadow-sm`}>
                <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest">
                    Live Stream: {isConnected ? "Active" : "Static"}
                </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={refresh}
            disabled={!isConnected}
            className="px-6 py-3 bg-white border border-stone-200 hover:border-stone-900 text-stone-500 hover:text-stone-900 transition-all text-[10px] font-black uppercase tracking-widest rounded-xl shadow-sm disabled:opacity-40"
          >
            Manual Sync
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-stone-900 text-white hover:bg-black transition-all text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-stone-200"
          >
            Hub
          </Link>
        </div>
      </div>

      {/* Process Table Section */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white border border-stone-200 rounded-[2rem] shadow-sm overflow-hidden transition-all hover:shadow-xl hover:shadow-stone-200/50">
          
          {/* Table Header */}
          <div className="grid grid-cols-[3fr_1fr_1fr_1fr_1fr] gap-4 px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 border-b border-stone-100 bg-stone-50/50">
            <div>Image Name</div>
            <div className="text-center">PID</div>
            <div className="text-center">CPU Load</div>
            <div className="text-center">Memory</div>
            <div className="text-right">Operations</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-stone-100 max-h-[65vh] overflow-y-auto scrollbar-thin scrollbar-thumb-stone-200 scrollbar-track-transparent">
            {processes.map((p) => (
              <div
                key={p.pid}
                className="grid grid-cols-[3fr_1fr_1fr_1fr_1fr] gap-4 px-8 py-4 text-sm items-center hover:bg-orange-50/30 transition-all group"
              >
                <div className="font-black text-stone-800 truncate flex items-center gap-3">
                    <span className="w-2 h-2 bg-stone-200 rounded-full group-hover:bg-orange-400 transition-colors" />
                    {p.name}
                </div>
                <div className="text-center font-mono text-xs text-stone-400 font-bold">{p.pid}</div>
                <div className="text-center">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-black ${p.cpu > 20 ? 'bg-red-50 text-red-600' : 'bg-stone-50 text-stone-500'}`}>
                        {p.cpu?.toFixed ? p.cpu.toFixed(1) : p.cpu}%
                    </span>
                </div>
                <div className="text-center text-stone-500 font-bold text-xs">
                    {p.mem?.toFixed ? p.mem.toFixed(1) : p.mem}%
                </div>
                <div className="text-right">
                  <button
                    onClick={() => {
                      if (!isConnected) return;
                      setConfirmPid(p.pid);
                      setConfirmName(p.name);
                    }}
                    disabled={!isConnected || lockdown}
                    className="opacity-0 group-hover:opacity-100 transition-all px-4 py-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white text-[9px] font-black uppercase rounded-lg tracking-widest disabled:opacity-0"
                  >
                    Kill Process
                  </button>
                </div>
              </div>
            ))}
            
            {processes.length === 0 && (
              <div className="px-8 py-20 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-stone-50 rounded-full mb-4">
                    <div className="w-4 h-4 border-2 border-stone-200 border-t-stone-800 rounded-full animate-spin" />
                </div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                  Initializing Thread Scan...
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Legend / Stats Footer */}
        <div className="mt-8 flex justify-between items-center px-4">
            <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">
                Total Threads: {processes.length}
            </p>
            <p className="text-[9px] text-stone-300 font-bold uppercase tracking-[0.5em]">
                Secure Session Interface
            </p>
        </div>
      </div>

      {/* Modern Termination Modal */}
      {confirmPid !== null && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-stone-200 rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl relative overflow-hidden">
            <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-6">
                    ⚠️
                </div>
                <h2 className="text-2xl font-black text-stone-900 uppercase italic tracking-tighter mb-2">End Process?</h2>
                <p className="text-sm text-stone-500 mb-8 px-4">
                  Terminating <span className="font-black text-stone-900 truncate block mt-1">{confirmName}</span> might cause system instability or data loss.
                </p>
                
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setConfirmPid(null);
                      setConfirmName("");
                    }}
                    className="flex-1 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 hover:bg-stone-50 rounded-2xl transition-all"
                  >
                    Abort
                  </button>
                  <button
                    onClick={() => {
                      if (lockdown) {
                        toast.error("Lockdown Active");
                        return;
                      }
                      emitSecure("kill-process", { pid: confirmPid });
                      setConfirmPid(null);
                      setConfirmName("");
                    }}
                    className="flex-1 px-6 py-4 text-[10px] font-black uppercase tracking-widest bg-red-600 text-white rounded-2xl hover:bg-red-700 shadow-lg shadow-red-100 transition-all"
                  >
                    Terminate
                  </button>
                </div>
            </div>
            <div className="absolute top-0 left-0 w-full h-1 bg-red-600" />
          </div>
        </div>
      )}
    </div>
  );
}