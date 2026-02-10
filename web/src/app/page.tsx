"use client";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, Cpu, Terminal, Zap, Activity, Server, 
  Command, ChevronRight, Lock, LayoutDashboard, Database, HardDrive 
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <div className="min-h-screen w-full bg-stone-100 text-stone-900 font-sans selection:bg-orange-200 selection:text-orange-900">
      
      {/* 1. NAVIGATION */}
      <nav className="fixed top-0 w-full z-50 bg-stone-100/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-9 h-9 bg-orange-600 rounded-xl flex items-center justify-center font-black text-white italic shadow-lg shadow-orange-600/20">N</div>
            <h1 className="text-xl font-black tracking-tighter italic">NEXUS</h1>
          </div>
          
          <div className="flex items-center gap-8">
            {hasClerk ? (
              <>
                <SignedIn>
                  <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-stone-200 shadow-sm">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">Agent Linked</span>
                  </div>
                  <button onClick={() => router.push("/dashboard")} className="text-xs font-bold hover:text-orange-600 transition-colors uppercase tracking-widest">Console</button>
                </SignedIn>
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="text-xs font-bold hover:text-orange-600 transition-colors uppercase tracking-widest">Sign In</button>
                  </SignInButton>
                </SignedOut>
              </>
            ) : (
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Auth Disabled</span>
            )}
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION (Page 1) */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-stone-200 shadow-sm text-[11px] font-black text-orange-600 uppercase tracking-[0.2em]">
              <Lock size={12} /> Military Grade Remote Access
            </div>
            <h2 className="text-7xl md:text-[120px] font-black tracking-tighter leading-[0.8] text-stone-900">
              Control your OS <br /> 
              <span className="text-orange-600 italic">without limits.</span>
            </h2>
            <p className="max-w-2xl text-lg md:text-xl text-stone-500 font-medium leading-relaxed">
              Nexus bridges the gap between your hardware and the web. A high-performance agent-based 
              interface designed for developers and power users.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              {hasClerk ? (
                <>
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button className="px-10 py-5 bg-orange-600 text-white font-bold rounded-2xl hover:bg-orange-700 transition-all hover:scale-105 shadow-2xl shadow-orange-600/30 flex items-center gap-3 group uppercase text-xs tracking-widest">
                        Initialize Session <ChevronRight className="group-hover:translate-x-1 transition-transform" size={16} />
                      </button>
                    </SignInButton>
                  </SignedOut>
                  <SignedIn>
                    <button onClick={() => router.push("/dashboard")} className="px-10 py-5 bg-stone-900 text-white font-bold rounded-2xl hover:bg-black transition-all hover:scale-105 shadow-2xl shadow-stone-900/20 uppercase text-xs tracking-widest">
                      Enter Master Console
                    </button>
                  </SignedIn>
                </>
              ) : (
                <button className="px-10 py-5 bg-stone-300 text-stone-600 font-bold rounded-2xl uppercase text-xs tracking-widest cursor-not-allowed">
                  Auth Required
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. CAPABILITIES (Page 2) */}
      <section className="py-32 bg-white border-y border-stone-200 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-12">
              <div className="space-y-4">
                <h3 className="text-4xl font-black tracking-tight text-stone-900 uppercase italic">Power & Precision</h3>
                <p className="text-stone-500 font-medium leading-relaxed">Nexus isn't just a dashboard; it's a native extension of your machine. Every interaction is optimized for zero-latency execution.</p>
              </div>
              
              <div className="grid gap-8">
                <CapabilityItem icon={<Cpu />} title="Hardware Telemetry" desc="Deep-level access to CPU threads, RAM allocation, and temperature sensors." />
                <CapabilityItem icon={<Database />} title="Filesystem Auth" desc="Read and edit system files with a native-grade remote editor." />
                <CapabilityItem icon={<Zap />} title="Socket Bridge" desc="Persistent bi-directional communication via high-speed WebSockets." />
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-10 bg-orange-500/5 rounded-full blur-3xl" />
              <div className="relative bg-stone-50 border border-stone-200 rounded-[40px] p-8 shadow-2xl">
                 <div className="space-y-6">
                    <div className="h-2 w-24 bg-orange-600 rounded-full" />
                    <div className="space-y-3">
                      <div className="h-4 w-full bg-stone-200 rounded-lg animate-pulse" />
                      <div className="h-4 w-4/5 bg-stone-200 rounded-lg animate-pulse" />
                      <div className="h-4 w-2/3 bg-stone-200 rounded-lg animate-pulse" />
                    </div>
                    <div className="pt-8 grid grid-cols-2 gap-4">
                      <div className="h-24 bg-white rounded-3xl border border-stone-200 flex flex-col justify-center items-center">
                        <Activity className="text-orange-600 mb-2" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Live Stream</span>
                      </div>
                      <div className="h-24 bg-white rounded-3xl border border-stone-200 flex flex-col justify-center items-center">
                        <Server className="text-orange-600 mb-2" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Native Agent</span>
                      </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ACTIVE MODULES (Page 3 - Only if SignedIn) */}
      {hasClerk && (
        <SignedIn>
          <section className="py-32 px-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
              <div className="space-y-2">
                <h3 className="text-5xl font-black tracking-tighter italic uppercase text-stone-900">Console Modules</h3>
                <p className="text-stone-400 font-bold uppercase text-[10px] tracking-[0.4em]">Establish connection with remote protocols</p>
              </div>
              <div className="h-[1px] flex-grow bg-stone-200 mx-8 hidden md:block" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <ModuleCard title="File Editor" desc="Remote filesystem access" onClick={() => router.push("/dashboard")} icon={<LayoutDashboard />} />
              <ModuleCard title="System Health" desc="Live CPU & memory stats" onClick={() => router.push("/health")} icon={<Activity />} />
              <ModuleCard title="Processes" desc="Inspect and kill tasks" onClick={() => router.push("/processes")} icon={<Terminal />} />
              <ModuleCard title="Power Control" desc="Restart or shutdown" onClick={() => router.push("/power")} icon={<Zap />} />
            </div>
          </section>
        </SignedIn>
      )}

      {/* 5. ARCHITECTURE (Page 4) */}
      <section className="py-32 bg-stone-900 text-stone-100 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-16">
          <div className="space-y-4">
            <h3 className="text-4xl font-black italic tracking-tight uppercase">Security Architecture</h3>
            <p className="text-stone-400 max-w-xl mx-auto">A multi-layered defense system to ensure your hardware remains yours and only yours.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 text-left">
            <div className="space-y-4 p-8 bg-stone-800/50 rounded-3xl border border-stone-700">
              <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center"><ShieldCheck size={20} /></div>
              <h4 className="font-bold">Identity Guard</h4>
              <p className="text-xs text-stone-500 leading-relaxed">Clerk-powered authentication with Owner-ID verification at every request.</p>
            </div>
            <div className="space-y-4 p-8 bg-stone-800/50 rounded-3xl border border-stone-700">
              <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center"><Command size={20} /></div>
              <h4 className="font-bold">Secret Handshake</h4>
              <p className="text-xs text-stone-500 leading-relaxed">Socket-level 32-bit encrypted secret keys required for destructive actions.</p>
            </div>
            <div className="space-y-4 p-8 bg-stone-800/50 rounded-3xl border border-stone-700">
              <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center"><HardDrive size={20} /></div>
              <h4 className="font-bold">Execution Safety</h4>
              <p className="text-xs text-stone-500 leading-relaxed">Physical lockdown toggles to prevent accidental remote commands.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-20 text-center border-t border-stone-200">
        <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.8em]">Nexus Framework // 2026 // Authorized Access Only</p>
        <a
          href="https://github.com/ParthTiwari2599"
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block text-[10px] font-bold text-stone-400 uppercase tracking-widest hover:text-orange-600 transition-colors"
        >
          Made by Parth Tiwari
        </a>
      </footer>
    </div>
  );
}

// Components
function CapabilityItem({ icon, title, desc }: any) {
  return (
    <div className="flex gap-6 group">
      <div className="w-12 h-12 bg-white rounded-2xl border border-stone-200 flex items-center justify-center text-orange-600 shadow-sm group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-stone-900 tracking-tight">{title}</h4>
        <p className="text-xs text-stone-500 leading-relaxed mt-1 max-w-xs">{desc}</p>
      </div>
    </div>
  );
}

function ModuleCard({ title, desc, onClick, icon }: any) {
  return (
    <button onClick={onClick} className="group p-8 bg-stone-50 border border-stone-200 text-left rounded-[40px] hover:bg-white hover:border-orange-500 transition-all hover:shadow-2xl hover:shadow-orange-500/10 flex flex-col justify-between h-64 overflow-hidden">
      <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm">
        {icon}
      </div>
      <div>
        <h4 className="text-2xl font-black text-stone-900 group-hover:text-orange-600 transition-colors tracking-tighter uppercase italic">{title}</h4>
        <p className="mt-2 text-[10px] text-stone-400 font-bold uppercase tracking-widest">{desc}</p>
      </div>
    </button>
  );
}
