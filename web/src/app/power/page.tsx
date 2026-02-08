"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { emitSecure, socket } from "@/socket";
import Link from "next/link";
import { toast } from "sonner";

const HAS_CLERK = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

function PowerPageWithClerk() {
  const { user } = useUser();
  const [isConnected, setIsConnected] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"shutdown" | "restart" | "sleep" | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [lockdown, setLockdown] = useState(false);
  const ownerId = process.env.NEXT_PUBLIC_OWNER_ID;
  const isOwner = !ownerId || user?.id === ownerId;

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      if (user) {
        emitSecure("verify-owner", { userId: user.id });
      }
    };
    const handleDisconnect = () => setIsConnected(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    if (socket.connected) handleConnect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [user]);

  useEffect(() => {
    const saved = localStorage.getItem("nexus_lockdown");
    setLockdown(saved === "true");
  }, []);

  const run = (action: "shutdown" | "restart" | "sleep") => {
    if (!isConnected) {
      toast.error("Bridge Disconnected");
      return;
    }
    if (lockdown) {
      toast.error("System in Lockdown");
      return;
    }
    setConfirmText("");
    setConfirmAction(action);
  };

  if (user && !isOwner) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-8 font-sans">
        <div className="text-center">
            <h1 className="text-8xl font-black text-stone-200 mb-4 tracking-tighter">403</h1>
            <p className="text-xs font-black text-stone-400 uppercase tracking-[0.5em]">Authorization Revoked</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 p-8 font-sans selection:bg-orange-100">
      
      {/* Header Section */}
      <div className="flex justify-between items-start mb-20 border-b border-stone-200 pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center text-white font-black italic shadow-xl">N</div>
            <div>
                <h1 className="text-4xl font-black text-stone-900 tracking-tighter uppercase leading-none">
                    Power <span className="text-orange-600">Grid</span>
                </h1>
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-[0.3em] mt-2">Hardware Protocol Management</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
            <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest">
                System Link: {isConnected ? "Active" : "Interrupted"}
            </span>
            {lockdown && (
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-[8px] font-black uppercase rounded tracking-widest border border-red-200">
                    Lockdown Active
                </span>
            )}
          </div>
        </div>

        <Link
          href="/"
          className="px-10 py-4 bg-white border border-stone-200 text-stone-400 hover:text-stone-900 hover:border-stone-900 transition-all text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-sm hover:shadow-xl"
        >
          Return to Hub
        </Link>
      </div>

      {/* Control Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Shutdown Card */}
        <button
          onClick={() => run("shutdown")}
          disabled={!isConnected || lockdown}
          className="group relative h-64 bg-white border border-stone-200 rounded-[2.5rem] p-8 flex flex-col justify-between overflow-hidden transition-all hover:border-red-500 hover:shadow-2xl hover:shadow-red-100 disabled:opacity-20 disabled:grayscale"
        >
            <div className="text-left">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 group-hover:text-red-400 transition-colors">Protocol 00</p>
                <h3 className="text-3xl font-black text-stone-900 italic tracking-tighter uppercase">Shutdown</h3>
            </div>
            <div className="flex items-end justify-between">
                <div className="w-12 h-12 border-2 border-stone-100 group-hover:border-red-100 rounded-full flex items-center justify-center text-stone-300 group-hover:text-red-500 font-black transition-all">⏻</div>
                <span className="text-[9px] font-black text-stone-300 group-hover:text-red-300 transition-colors">HARD_KILL</span>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-all blur-3xl" />
        </button>

        {/* Restart Card */}
        <button
          onClick={() => run("restart")}
          disabled={!isConnected || lockdown}
          className="group relative h-64 bg-white border border-stone-200 rounded-[2.5rem] p-8 flex flex-col justify-between overflow-hidden transition-all hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-100 disabled:opacity-20 disabled:grayscale"
        >
            <div className="text-left">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 group-hover:text-orange-400 transition-colors">Protocol 01</p>
                <h3 className="text-3xl font-black text-stone-900 italic tracking-tighter uppercase">Restart</h3>
            </div>
            <div className="flex items-end justify-between">
                <div className="w-12 h-12 border-2 border-stone-100 group-hover:border-orange-100 rounded-full flex items-center justify-center text-stone-300 group-hover:text-orange-500 font-black transition-all">↻</div>
                <span className="text-[9px] font-black text-stone-300 group-hover:text-orange-300 transition-colors">SOFT_REBOOT</span>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-all blur-3xl" />
        </button>

        {/* Sleep Card */}
        <button
          onClick={() => run("sleep")}
          disabled={!isConnected || lockdown}
          className="group relative h-64 bg-white border border-stone-200 rounded-[2.5rem] p-8 flex flex-col justify-between overflow-hidden transition-all hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-100 disabled:opacity-20 disabled:grayscale"
        >
            <div className="text-left">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 group-hover:text-blue-400 transition-colors">Protocol 02</p>
                <h3 className="text-3xl font-black text-stone-900 italic tracking-tighter uppercase">Sleep</h3>
            </div>
            <div className="flex items-end justify-between">
                <div className="w-12 h-12 border-2 border-stone-100 group-hover:border-blue-100 rounded-full flex items-center justify-center text-stone-300 group-hover:text-blue-500 font-black transition-all">💤</div>
                <span className="text-[9px] font-black text-stone-300 group-hover:text-blue-300 transition-colors">HIBERNATE</span>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-all blur-3xl" />
        </button>

      </div>

      {/* Confirmation Modal: Clean & Focused */}
      {confirmAction && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] p-10 w-full max-w-md shadow-2xl border border-stone-200 relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-2 h-8 bg-orange-600 rounded-full" />
                    <h2 className="text-2xl font-black text-stone-900 uppercase italic tracking-tighter">Authorize Protocol</h2>
                </div>
                
                <p className="text-sm text-stone-500 font-medium leading-relaxed mb-8">
                  You are about to execute a <span className="text-stone-900 font-black underline decoration-orange-500 decoration-2 italic">{confirmAction}</span> command. This will terminate all active remote sessions.
                </p>

                {(confirmAction === "shutdown" || confirmAction === "restart") && (
                  <div className="space-y-3 mb-8">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Identity Verification</label>
                    <input
                        autoFocus
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="TYPE 'CONFIRM' TO PROCEED"
                        className="w-full bg-stone-50 border-2 border-stone-100 rounded-2xl px-6 py-4 text-xs font-bold text-stone-900 focus:outline-none focus:border-orange-500 transition-all placeholder:text-stone-300 uppercase tracking-widest"
                    />
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="flex-1 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 hover:bg-stone-50 rounded-2xl transition-all"
                  >
                    Abort
                  </button>
                  <button
                    onClick={() => {
                      const needsConfirm = confirmAction === "shutdown" || confirmAction === "restart";
                      if (needsConfirm && confirmText !== "CONFIRM") {
                        toast.error("Invalid Verification String");
                        return;
                      }
                      emitSecure("power-command", { action: confirmAction });
                      toast.success("Signal Transmitted");
                      setConfirmAction(null);
                    }}
                    className="flex-1 px-6 py-4 text-[10px] font-black uppercase tracking-widest bg-stone-900 text-white rounded-2xl hover:bg-black shadow-lg shadow-stone-200 transition-all"
                  >
                    Execute
                  </button>
                </div>
            </div>
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-stone-50 rounded-full -mr-24 -mb-24 opacity-50 blur-3xl pointer-events-none" />
          </div>
        </div>
      )}

      {/* Footer Decoration */}
      <div className="mt-24 text-center">
         <p className="text-[9px] text-stone-300 font-black uppercase tracking-[1em]">Nexus Hardware Control System v3.0</p>
      </div>
    </div>
  );
}

export default function PowerPage() {
  if (!HAS_CLERK) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-8">
        <div className="max-w-md rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-400">Configuration Required</p>
          <p className="mt-3 text-sm font-bold text-stone-700">
            Set <span className="font-mono">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</span> to enable this page.
          </p>
        </div>
      </div>
    );
  }

  return <PowerPageWithClerk />;
}
