"use client";
import { useEffect, useRef } from 'react';
import { emitSecure, socket } from '@/socket';

export default function NexusTerminal() {
    const terminalRef = useRef<HTMLDivElement>(null);
    const isInitialized = useRef(false);

    useEffect(() => {
        if (isInitialized.current) return;

        const initTerminal = async () => {
            try {
                // Dynamic imports to prevent SSR issues
                const { Terminal } = await import('@xterm/xterm');
                const { FitAddon } = await import('@xterm/addon-fit');
                await import('@xterm/xterm/css/xterm.css');

                if (!terminalRef.current) return;

                const term = new Terminal({
                    cursorBlink: true,
                    theme: {
                        background: '#0c0a09',
                        foreground: '#f97316',
                    },
                    fontFamily: 'monospace',
                    fontSize: 14,
                });

                const fitAddon = new FitAddon();
                term.loadAddon(fitAddon);
                term.open(terminalRef.current);
                fitAddon.fit();

                isInitialized.current = true;

                // Listen for output from Agent
                socket.on('terminal-output', (data) => {
                    term.write(data);
                });

                // Send input to Agent
                term.onData(data => {
                    emitSecure('terminal-input', { data });
                });

                // Handle window resize
                window.addEventListener('resize', () => fitAddon.fit());

            } catch (error) {
                console.error("Failed to load terminal:", error);
            }
        };

        initTerminal();

        return () => {
            socket.off('terminal-output');
        };
    }, []);

    return (
        <div className="w-full h-full bg-[#0c0a09] overflow-hidden">
            <div ref={terminalRef} className="h-full w-full" />
        </div>
    );
}
