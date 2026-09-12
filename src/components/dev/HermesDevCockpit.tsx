'use client';

import React, { useState, useEffect } from 'react';
import { Bug, CheckCircle2, Cpu, Wrench, X } from 'lucide-react';

interface CapturedDevError {
  id: string;
  name: string;
  message: string;
  stack?: string;
  route: string;
  timestamp: string;
}

export default function HermesDevCockpit() {
  const [isOpen, setIsOpen] = useState(false);
  const [agentOnline, setAgentOnline] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<CapturedDevError[]>([]);
  const [activeError, setActiveError] = useState<CapturedDevError | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    rootCause: string;
    targetFile: string;
    diff: string;
  } | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  // Check health of local Hermes agent (port 8000)
  const checkAgentHealth = async () => {
    try {
      const res = await fetch('http://localhost:8000/health', { method: 'GET', signal: AbortSignal.timeout(1500) });
      setAgentOnline(res.ok);
    } catch {
      setAgentOnline(false);
    }
  };

  useEffect(() => {
    checkAgentHealth();
    const interval = setInterval(checkAgentHealth, 10000);

    // Intercept console.error to catch development warnings and exceptions
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError(...args);
      const msg = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      setErrors((prev) => [
        {
          id: Math.random().toString(36).substring(7),
          name: 'DevConsoleError',
          message: msg.slice(0, 300),
          route: window.location.pathname,
          timestamp: new Date().toLocaleTimeString()
        },
        ...prev.slice(0, 19)
      ]);
    };

    return () => {
      clearInterval(interval);
      console.error = originalConsoleError;
    };
  }, []);

  const handleAskHermes = async (err: CapturedDevError) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setAppliedSuccess(false);
    setActiveError(err);

    try {
      const res = await fetch('http://localhost:8000/api/dev/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorName: err.name,
          errorMessage: err.message,
          stack: err.stack,
          route: err.route
        })
      });

      if (!res.ok) throw new Error('Agent returned status ' + res.status);
      const data = await res.json();
      setAnalysisResult(data);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      setAnalysisResult({
        rootCause: `Không thể kết nối với Hermes Local Agent: ${msg}`,
        targetFile: 'N/A',
        diff: ''
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyFix = async () => {
    if (!analysisResult || !analysisResult.diff) return;
    try {
      const res = await fetch('http://localhost:8000/api/dev/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetFile: analysisResult.targetFile,
          diff: analysisResult.diff
        })
      });
      if (res.ok) {
        setAppliedSuccess(true);
      }
    } catch (err) {
      alert('Lỗi khi ghi đè file: ' + String(err));
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 font-sans text-xs">
      {/* Floating Pill Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-full shadow-2xl border border-zinc-700 hover:scale-105 transition"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              agentOnline ? 'bg-emerald-400' : 'bg-rose-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              agentOnline ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          />
        </span>
        <span className="font-semibold flex items-center gap-1">
          <Cpu className="w-3.5 h-3.5" /> Hermes Dev
        </span>
        {errors.length > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-bold text-[10px]">
            {errors.length}
          </span>
        )}
      </button>

      {/* Cockpit Drawer Modal */}
      {isOpen && (
        <div className="absolute bottom-12 left-0 w-96 max-h-[500px] bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/60">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-zinc-800 dark:text-zinc-200">Hermes Dev Cockpit</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500">
                Agent: {agentOnline ? 'Online (8000)' : 'Offline'}
              </span>
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-3 overflow-y-auto flex-1 space-y-2">
            {errors.length === 0 ? (
              <p className="text-zinc-400 text-center py-6">Không có lỗi nào được ghi nhận</p>
            ) : (
              errors.map((err) => (
                <div
                  key={err.id}
                  className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-zinc-300 transition"
                >
                  <div className="flex items-center justify-between text-zinc-500 text-[10px] mb-1">
                    <span className="font-mono text-rose-500 font-bold">{err.name}</span>
                    <span>{err.timestamp}</span>
                  </div>
                  <p className="text-zinc-700 dark:text-zinc-300 font-mono text-[11px] line-clamp-2">
                    {err.message}
                  </p>
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => handleAskHermes(err)}
                      disabled={isAnalyzing}
                      className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded font-medium flex items-center gap-1 shadow-sm transition disabled:opacity-50"
                    >
                      <Wrench className="w-3 h-3" />
                      {isAnalyzing && activeError?.id === err.id ? 'Đang phân tích...' : 'Fix với Hermes'}
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Analysis Result Box */}
            {analysisResult && (
              <div className="mt-3 p-3 bg-zinc-950 text-zinc-100 rounded-lg border border-zinc-800 space-y-2">
                <div className="font-bold text-amber-400 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5" /> Nguyên nhân lỗi:
                </div>
                <p className="text-xs text-zinc-300">{analysisResult.rootCause}</p>
                {analysisResult.diff && (
                  <>
                    <div className="text-[10px] text-zinc-500 font-mono">File: {analysisResult.targetFile}</div>
                    <pre className="p-2 bg-black/60 rounded text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-32">
                      {analysisResult.diff}
                    </pre>
                    <button
                      onClick={handleApplyFix}
                      disabled={appliedSuccess}
                      className={`w-full py-1.5 rounded font-bold transition flex items-center justify-center gap-1 ${
                        appliedSuccess ? 'bg-emerald-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      }`}
                    >
                      {appliedSuccess ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đã áp dụng bản fix!
                        </>
                      ) : (
                        '⚡ Áp dụng Fix vào Code'
                      )}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
