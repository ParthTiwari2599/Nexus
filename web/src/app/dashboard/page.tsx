"use client";

import { useEffect, useState, useRef } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { emitSecure, socket } from "@/socket";
import { toast } from "sonner";
import NexusTerminal from "@/components/Terminal";
import Editor from '@monaco-editor/react';

export default function Dashboard() {
  const { user } = useUser();
  const [isConnected, setIsConnected] = useState(false);
  const [sysInfo, setSysInfo] = useState({ username: "...", platform: "...", homeDir: "..." });
  const [files, setFiles] = useState([]);
  const [tabs, setTabs] = useState<{ path: string; name: string; content: string }[]>([]);
  const [activeTabPath, setActiveTabPath] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState("");
  const [backStack, setBackStack] = useState<string[]>([]);
  const [forwardStack, setForwardStack] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [lockdown, setLockdown] = useState(false);
  const currentPathRef = useRef("");
  const backStackRef = useRef<string[]>([]);
  const forwardStackRef = useRef<string[]>([]);

  // --- Logic Functions (Absolutely Untouched) ---
  const handleSave = () => {
    const currentTab = tabs.find(t => t.path === activeTabPath);
    if (currentTab?.path) {
      emitSecure('save-file', { filePath: currentTab.path, content: currentTab.content });
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (!activeTabPath) return;
    setTabs(prev => prev.map(t => t.path === activeTabPath ? { ...t, content: value || "" } : t));
  };

  const updateCurrentPath = (path: string) => {
    currentPathRef.current = path;
    setCurrentPath(path);
  };

  const updateBackStack = (updater: string[] | ((prev: string[]) => string[])) => {
    setBackStack(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      backStackRef.current = next;
      return next;
    });
  };

  const updateForwardStack = (updater: string[] | ((prev: string[]) => string[])) => {
    setForwardStack(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      forwardStackRef.current = next;
      return next;
    });
  };

  const requestFiles = (path?: string, pushHistory = true) => {
    if (path) {
      setCurrentPath(prev => {
        if (pushHistory && prev && prev !== path) {
          updateBackStack(stack => [...stack, prev]);
          updateForwardStack([]);
        }
        currentPathRef.current = path;
        return path;
      });
      emitSecure("get-files", { path });
    } else {
      emitSecure("get-files", {});
    }
  };

  const handleBack = () => {
    const back = backStackRef.current;
    if (back.length > 0) {
      const target = back[back.length - 1];
      updateBackStack(back.slice(0, -1));
      if (currentPathRef.current) updateForwardStack(stack => [...stack, currentPathRef.current]);
      requestFiles(target, false);
      return;
    }
    const current = currentPathRef.current;
    if (!current) return;
    const parts = current.split("\\").filter(Boolean);
    if (parts.length === 0) return;
    parts.pop();
    let parent = parts.join("\\");
    if (parts.length === 1 && parts[0].includes(":")) parent += "\\";
    updateForwardStack(stack => [...stack, current]);
    requestFiles(parent || "C:\\", false);
  };

  const handleForward = () => {
    const forward = forwardStackRef.current;
    if (forward.length === 0) return;
    const target = forward[forward.length - 1];
    updateForwardStack(forward.slice(0, -1));
    if (currentPathRef.current) updateBackStack(stack => [...stack, currentPathRef.current]);
    requestFiles(target, false);
  };

  const handleCreateNode = (type: "file" | "folder") => {
    const name = prompt(type === "file" ? "New file name" : "New folder name");
    if (!name) return;
    const base = currentPathRef.current || "";
    const separator = base.endsWith("\\") ? "" : "\\";
    const targetPath = `${base}${separator}${name}`;
    emitSecure("create-node", { type: type === "file" ? "file" : "folder", path: targetPath });
  };

  const handleDeleteNode = (path: string, name: string) => {
    if (!confirm(`Delete ${name}?`)) return;
    emitSecure("delete-node", { path });
  };

  // --- Effects (Untouched) ---
  useEffect(() => {
    socket.on("connect", () => setIsConnected(true));
    socket.on("system-info", (data) => {
      setSysInfo(data);
      if (!currentPathRef.current) updateCurrentPath(data.homeDir || "");
    });
    socket.on("owner-verified", () => {
      setIsVerified(true);
      emitSecure("get-system-info", {});
      requestFiles();
    });
    socket.on("file-list", (data) => setFiles(data));
    socket.on("file-content", (data) => {
        setTabs(prev => {
            const exists = prev.find(t => t.path === data.path);
            if (exists) return prev;
            return [...prev, { path: data.path, name: data.path.split('\\').pop() || '', content: data.content }];
        });
        setActiveTabPath(data.path);
    });
    socket.on("save-success", (msg) => toast.success(msg || "Saved"));
    socket.on("error", () => toast.error("Action Failed"));
    socket.on("read-error", () => toast.error("Action Failed"));
    socket.on("node-created", () => requestFiles(currentPathRef.current || undefined, false));
    socket.on("node-deleted", () => requestFiles(currentPathRef.current || undefined, false));

    return () => {
      socket.off("connect");
      socket.off("system-info");
      socket.off("file-list");
      socket.off("file-content");
      socket.off("save-success");
      socket.off("error");
      socket.off("read-error");
      socket.off("node-created");
      socket.off("node-deleted");
      socket.off("owner-verified");
    };
  }, []);

  useEffect(() => {
    if (isConnected && user) emitSecure("verify-owner", { userId: user.id });
  }, [isConnected, user]);

  useEffect(() => {
    const saved = localStorage.getItem("nexus_lockdown");
    setLockdown(saved === "true");
  }, []);

  const toggleLockdown = () => {
    const next = !lockdown;
    setLockdown(next);
    localStorage.setItem("nexus_lockdown", next ? "true" : "false");
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeTabPath, tabs]);

  const closeTab = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    const newTabs = tabs.filter(t => t.path !== path);
    setTabs(newTabs);
    if (activeTabPath === path) setActiveTabPath(newTabs.length > 0 ? newTabs[newTabs.length - 1].path : null);
  };

  const currentTab = tabs.find(t => t.path === activeTabPath);

  return (
    <div className="flex h-screen w-full bg-stone-100 text-stone-900 font-sans overflow-hidden">
      
      {/* SIDEBAR: Modern Industrial Look */}
      <aside className="w-72 border-r border-stone-200 bg-white flex flex-col shadow-sm">
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-stone-900 font-black text-xl tracking-tighter italic leading-none">NEXUS</h2>
            <div className="flex items-center gap-2">
              <div className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">
                {isConnected ? 'System Live' : 'Link Broken'}
              </span>
            </div>
          </div>
          <Link href="/" className="text-[10px] font-bold text-stone-400 hover:text-orange-600 transition-colors">EXIT</Link>
        </div>

        {/* User Stats Card (Static visual improvement) */}
        <div className="px-4 py-4 bg-stone-50/50 border-b border-stone-100">
            <div className="flex items-center gap-3">
                <div className="border-2 border-white rounded-full shadow-sm">
                    <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="text-[10px] font-black text-stone-800 truncate uppercase leading-none">{user?.username || 'User'}</p>
                    <p className="text-[9px] font-bold text-stone-400 mt-1 uppercase tracking-tighter">Authorized Session</p>
                </div>
            </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto overflow-x-hidden space-y-6">
          {/* Navigation Controls */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
                <p className="text-stone-400 text-[9px] uppercase tracking-[0.2em] font-black">Control</p>
                <div className="flex gap-1">
                    <button onClick={handleBack} disabled={!isConnected} className="w-8 h-8 flex items-center justify-center bg-stone-100 hover:bg-stone-200 rounded-lg text-xs disabled:opacity-30">←</button>
                    <button onClick={handleForward} disabled={!isConnected} className="w-8 h-8 flex items-center justify-center bg-stone-100 hover:bg-stone-200 rounded-lg text-xs disabled:opacity-30">→</button>
                </div>
            </div>
            
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search directory..."
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="space-y-1">
            <button onClick={() => handleCreateNode("file")} disabled={!isConnected} className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-black uppercase text-stone-600 hover:bg-stone-50 hover:text-orange-600 rounded-xl transition-all border border-transparent hover:border-stone-100 disabled:opacity-30">
                <span className="text-lg leading-none">+</span> New File
            </button>
            <button onClick={() => handleCreateNode("folder")} disabled={!isConnected} className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-black uppercase text-stone-600 hover:bg-stone-50 hover:text-orange-600 rounded-xl transition-all border border-transparent hover:border-stone-100 disabled:opacity-30">
                <span className="text-lg leading-none">📁</span> New Folder
            </button>
            <button onClick={toggleLockdown} className={`w-full flex items-center gap-3 px-3 py-2 text-[10px] font-black uppercase rounded-xl transition-all border ${lockdown ? "bg-red-50 border-red-100 text-red-500" : "bg-stone-900 border-stone-800 text-stone-100 hover:bg-black"}`}>
                <span className="text-lg leading-none">⛨</span> {lockdown ? "Lockdown: On" : "Lockdown: Off"}
            </button>
          </div>

          {/* File List Section */}
          <div className="space-y-3">
            <div className="px-3 py-2 bg-stone-900 rounded-xl text-[9px] text-stone-400 font-mono break-all border border-stone-800 shadow-inner">
                <span className="text-orange-500 font-bold">ROOT:</span> {currentPath || 'Hardware'}
            </div>

            <div className="space-y-1">
                {files
                    .filter((file) => file.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((file) => (
                    <div 
                        key={file.path}
                        onClick={() => {
                            if (!isConnected) return;
                            file.isDir ? requestFiles(file.path) : emitSecure('read-file', { filePath: file.path });
                        }}
                        className="group flex items-center gap-3 p-2.5 hover:bg-stone-50 rounded-xl cursor-pointer transition-all border border-transparent hover:border-stone-200"
                    >
                        <span className={`text-xs ${file.isDir ? "text-orange-600" : "text-stone-300"}`}>
                            {file.isDir ? '■' : '□'}
                        </span>
                        <span className="flex-1 truncate text-[11px] font-bold text-stone-600 group-hover:text-stone-900">{file.name}</span>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteNode(file.path, file.name); }}
                            disabled={!isConnected}
                            className="opacity-0 group-hover:opacity-100 text-[10px] font-black text-stone-300 hover:text-red-500 transition-all"
                        >
                            DEL
                        </button>
                    </div>
                ))}
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT: Clean Editor Experience */}
      <main className="flex-1 flex flex-col bg-white">
        <section className="flex-1 flex flex-col relative">
          
          {/* Tabs UI */}
          <div className="flex bg-stone-50 border-b border-stone-200 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <div
                key={tab.path}
                onClick={() => setActiveTabPath(tab.path)}
                className={`flex items-center gap-3 px-6 py-3 cursor-pointer border-r border-stone-200 min-w-[140px] transition-all relative ${
                  activeTabPath === tab.path
                    ? 'bg-white text-stone-900 font-black'
                    : 'text-stone-400 hover:bg-stone-100'
                }`}
              >
                {activeTabPath === tab.path && <div className="absolute top-0 left-0 w-full h-0.5 bg-orange-600" />}
                <span className="text-[10px] uppercase tracking-tight truncate">{tab.name}</span>
                <button
                  onClick={(e) => closeTab(e, tab.path)}
                  className="hover:text-red-500 text-[12px] font-bold"
                >
                  ×
                </button>
              </div>
            ))}
            
            {/* Active File Save Button (Visual enhancement) */}
            {activeTabPath && (
                <div className="ml-auto flex items-center px-4">
                    <button
                        onClick={handleSave}
                        disabled={!isConnected}
                        className="bg-orange-600 text-white text-[9px] font-black px-4 py-1.5 rounded-lg hover:bg-orange-700 transition-all shadow-md shadow-orange-600/20 uppercase tracking-widest disabled:opacity-30"
                    >
                        Save Protocol
                    </button>
                </div>
            )}
          </div>

          <div className="flex-1 relative">
            {currentTab?.path ? (
                <Editor
                height="100%"
                theme="vs-light"
                path={currentTab.path}
                language={currentTab.path.split('.').pop()}
                value={currentTab.content}
                onChange={handleEditorChange}
                options={{ 
                    fontSize: 14, 
                    minimap: { enabled: false },
                    padding: { top: 20 },
                    fontFamily: 'JetBrains Mono, monospace',
                    lineNumbers: 'on',
                    renderLineHighlight: 'all',
                    scrollbar: { vertical: 'hidden' }
                }}
                />
            ) : (
                <div className="h-full flex flex-col items-center justify-center bg-stone-50/30 text-stone-300">
                    <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-2xl mb-4 italic font-black">N</div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Initialize remote node via explorer</p>
                </div>
            )}
          </div>
        </section>

        {/* TERMINAL: Industrial Dark Section */}
        <section className="h-72 bg-stone-900 flex flex-col border-t border-stone-800 shadow-2xl">
          <div className="px-4 py-2 border-b border-stone-800 flex justify-between items-center bg-black/20">
            <span className="text-[9px] font-black text-stone-500 uppercase tracking-[0.2em]">Hardware Output Stream</span>
            <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-stone-800" />
                <div className="w-2 h-2 rounded-full bg-stone-800" />
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <NexusTerminal />
          </div>
        </section>
      </main>
    </div>
  );
}