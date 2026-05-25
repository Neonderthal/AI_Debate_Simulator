import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquare,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Send,
  Sparkles,
  Trophy,
  Scale,
  Activity,
  AlertTriangle,
  History,
  TrendingUp,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  BrainCircuit,
  Clock,
} from "lucide-react";
import { DebateDurationMode, Turn, SummaryReport, DebateSettings } from "./types";
import TopicSelector from "./components/TopicSelector";
import ScoreScale from "./components/ScoreScale";
import SettingsModal from "./components/SettingsModal";

export default function App() {
  // Topic state
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [durationMode, setDurationMode] = useState<DebateDurationMode>("pro");
  const [proBotName, setProBotName] = useState<string>("Aegis");
  const [conBotName, setConBotName] = useState<string>("Vesper");

  // Timer states
  const [timeLeft, setTimeLeft] = useState<number>(180); // standards
  const [totalDuration, setTotalDuration] = useState<number>(180);

  // Debate Settings state
  const [settings, setSettings] = useState<DebateSettings>({
    chaoticMode: false,
    aiStiffness: 40,
    speakerAegisVoice: "Academic, Formal, Empirical",
    speakerVesperVoice: "Skeptical, Analytical, Deep",
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Simulation Running state
  const [history, setHistory] = useState<Turn[]>([]);
  const [balanceScore, setBalanceScore] = useState<number>(50); // Starts neutral in the middle
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [nextSpeaker, setNextSpeaker] = useState<"pro" | "con">("pro");

  // User input text
  const [userText, setUserText] = useState<string>("");
  const [isSubmittingUserTurn, setIsSubmittingUserTurn] = useState<boolean>(false);

  // Final summary analysis report card
  const [summaryReport, setSummaryReport] = useState<SummaryReport | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);

  // Fallback state
  const [hasActiveFallback, setHasActiveFallback] = useState<boolean>(false);

  // UI status and animations refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
  fetch("/api/health")
    .then(res => res.json())
    .then(data => {
      if (!data.hasApiKey) {
        setGenerateError("⚠️ No API key configured on the server. Debates will not work.");
      }
    })
    .catch(() => setGenerateError("⚠️ Could not reach the server."));
}, []);
  // Auto-scroll on transcript edits
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, isGenerating, isSubmittingUserTurn]);

  // Handle auto-advancing debate turns
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isAutoPlaying && !isGenerating && activeTopic && !summaryReport) {
      // Delay slightly between turn updates for realistic study reading
      timer = setTimeout(() => {
        triggerNextAiTurn();
      }, 1500);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isAutoPlaying, isGenerating, activeTopic, nextSpeaker, summaryReport]);

  // Handle active timer limit countdown tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isAutoPlaying && !isGenerating && activeTopic && durationMode !== "custom" && !summaryReport) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsAutoPlaying(false);
            if (interval) clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoPlaying, isGenerating, activeTopic, durationMode, summaryReport]);

  const startDebate = (topic: string, mode: DebateDurationMode, proName: string, conName: string) => {
    setActiveTopic(topic);
    setDurationMode(mode);
    setProBotName(proName);
    setConBotName(conName);
    setHistory([]);
    setBalanceScore(50);
    setNextSpeaker("pro");
    setSummaryReport(null);
    setGenerateError(null);
    setIsAutoPlaying(false);
    setHasActiveFallback(false);

    // Enforce initial countdown seconds per user requirements
    let initialSeconds = 180; // Default Pro (3 min)
    if (mode === "flash") {
      initialSeconds = 60; // 1 min (30s each side limit)
    } else if (mode === "ultra") {
      initialSeconds = 300; // 5 min
    } else if (mode === "custom") {
      initialSeconds = 0;
    }

    setTimeLeft(initialSeconds);
    setTotalDuration(initialSeconds);
  };

  const resetAll = () => {
    setActiveTopic(null);
    setHistory([]);
    setBalanceScore(50);
    setSummaryReport(null);
    setIsAutoPlaying(false);
    setGenerateError(null);
    setHasActiveFallback(false);
  };

  // Trigger next AI Bot turn on the server using Gemini
  const triggerNextAiTurn = async () => {
    if (!activeTopic || isGenerating || summaryReport) return;

    // Halt if timer completed
    if (durationMode !== "custom" && timeLeft <= 0) {
      setGenerateError("Debate timer elapsed. Request the Supreme Verdict Summary Report below to close the simulation.");
      setIsAutoPlaying(false);
      return;
    }

    setIsGenerating(true);
    setGenerateError(null);

    const currentSpeaker = nextSpeaker;

    try {
      const response = await fetch("/api/debate/next-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: activeTopic,
          history: history.map((h) => ({ speaker: h.speaker, text: h.text })),
          nextSpeaker: currentSpeaker,
          chaoticMode: settings.chaoticMode,
          durationMode: durationMode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const turnResult = await response.json();
      if (turnResult.isFallback) {
        setHasActiveFallback(true);
      }
      const speakerName = currentSpeaker === "pro" ? proBotName : conBotName;

      // Append new turn to local state
      const newTurn: Turn = {
        id: Math.random().toString(36).substr(2, 9),
        speaker: currentSpeaker,
        speakerName,
        text: turnResult.argument,
        scoreChange: turnResult.scoreChange,
        factRating: turnResult.factRating,
        factAnalysis: turnResult.factAnalysis,
        logicalFallacies: turnResult.logicalFallacies || [],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      };

      setHistory((prev) => [...prev, newTurn]);

      // Adjust the balance score
      setBalanceScore((prev) => {
        const updated = prev + turnResult.scoreChange;
        return Math.max(5, Math.min(95, updated)); // keep away from absolute extremes to keep game interactive
      });

      // Toggle next speaker
      setNextSpeaker(currentSpeaker === "pro" ? "con" : "pro");
    } catch (e: any) {
      console.error(e);
      setGenerateError(e.message || "Connection to Gemini failed.");
      setIsAutoPlaying(false);
    } finally {
      setIsGenerating(false);
    }
  };

  // Submit dynamic comment from the user depending on their stance
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userText.trim() || !activeTopic || isSubmittingUserTurn) return;

    const textToSubmit = userText.trim();
    setUserText("");
    setIsSubmittingUserTurn(true);
    setGenerateError(null);

    // Stop auto-play temporarily so the user can see analysis
    setIsAutoPlaying(false);

    try {
      const response = await fetch("/api/debate/user-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: activeTopic,
          history: history.map((h) => ({ speakerName: h.speakerName, text: h.text })),
          text: textToSubmit,
          chaoticMode: settings.chaoticMode,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error ${response.status}`);
      }

      const analysisResult = await response.json();
      if (analysisResult.isFallback) {
        setHasActiveFallback(true);
      }

      const userTurnEntry: Turn = {
        id: Math.random().toString(36).substr(2, 9),
        speaker: "user",
        speakerName: "Participant (Inquirer)",
        text: textToSubmit,
        scoreChange: analysisResult.scoreChange,
        factRating: analysisResult.factRating,
        factAnalysis: analysisResult.factAnalysis,
        logicalFallacies: analysisResult.logicalFallacies || [],
        moderatorComment: analysisResult.moderatorComment,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      };

      setHistory((prev) => [...prev, userTurnEntry]);

      // Apply score change
      setBalanceScore((prev) => {
        const updated = prev + analysisResult.scoreChange;
        return Math.max(5, Math.min(95, updated));
      });
    } catch (e: any) {
      console.error(e);
      setGenerateError("Failed to publish & analyze statement: " + e.message);
    } finally {
      setIsSubmittingUserTurn(false);
    }
  };

  // Assemble full report cards
  const requestArbiterVerdict = async () => {
    if (!activeTopic || history.length === 0 || isGeneratingSummary) return;

    setIsGeneratingSummary(true);
    setGenerateError(null);
    setIsAutoPlaying(false); // Stop auto playing to inspect summary

    try {
      const response = await fetch("/api/debate/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: activeTopic,
          history: history,
          chaoticMode: settings.chaoticMode,
        }),
      });

      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }

      const summary = await response.json();
      setSummaryReport(summary);
      if (summary.isFallback) {
        setHasActiveFallback(true);
      }
    } catch (e: any) {
      console.error(e);
      setGenerateError("Failed to trigger Supreme Arbiter's report card: " + e.message);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans" id="app-root-container">
      {/* Header Bar */}
      <header className="border-b border-stone-900 bg-stone-900/60 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 py-3.5 flex items-center justify-between" id="app-main-header">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" id="logo-icon-box">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-sans font-semibold text-white tracking-tight">
              Supreme AI Debate Arena
            </h1>
            <p className="text-[10px] font-mono text-stone-500">
              Dual-Agent Logic Simulation Engine • v2.1
            </p>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2" id="header-toolbar-box">
          {activeTopic && (
            <button
              onClick={resetAll}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-400 hover:text-white transition-colors text-xs font-mono"
              id="reset-debate-btn"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          )}

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-lg bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
            id="settings-gear-btn"
            title="Configure settings & Chaotic mode toggle"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col justify-center" id="main-content-flow">
        <AnimatePresence mode="wait">
          {!activeTopic ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              key="intro-selector"
            >
              <TopicSelector
                onStartDebate={startDebate}
                settingsAegisName={proBotName}
                settingsVesperName={conBotName}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              key="active-arena"
              className="space-y-6"
            >
              {/* Active Topic Banner Card */}
              <div
                className="bg-stone-900/40 border border-stone-850 rounded-2xl p-5 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                id="active-topic-status-card"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Active Arena Topic
                    </span>
                    {settings.chaoticMode && (
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                        ⚡ Chaotic Mode Enabled
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-sans font-medium text-white tracking-tight">
                    {activeTopic}
                  </h2>
                </div>

                <button
                  onClick={resetAll}
                  className="shrink-0 px-3 py-1.5 text-xs text-stone-400 hover:text-white border border-stone-800 rounded-lg hover:bg-stone-800 transition-all font-sans"
                  id="change-topic-btn"
                >
                  Change Topic
                </button>
              </div>

              {hasActiveFallback && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs leading-relaxed text-amber-300"
                  id="api-quota-fallback-notice"
                >
                  <p className="flex items-start gap-2 max-w-2xl">
                    <Sparkles className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Gemini API Quota Limit Reached:</strong> The simulator has automatically activated the **Arbiter local logic fallback engine** to safeguard your session. You can continue typing questions, simulating turns, and generating summary reports as usual without interruptions.
                    </span>
                  </p>
                  <span className="shrink-0 text-[10px] font-mono text-stone-500">Offline Fallback Active</span>
                </motion.div>
              )}

              {/* Grid: Left Column is debate stream & input, Right is real-time scores, voter box & summary report */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* DEBATE DIALOGUE TRANSCRIPT STREAM (7 columns) */}
                <div className="lg:col-span-7 flex flex-col h-[650px] bg-stone-900 border border-stone-850 rounded-2xl overflow-hidden shadow-xl" id="transcript-container-card">
                  
                  {/* Transcript Stream Header */}
                  <div className="border-b border-stone-800/80 bg-stone-950 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="flex items-center gap-2 text-xs font-mono text-stone-300">
                        <History className="h-4 w-4 text-indigo-400" />
                        Live Argument Transcript ({history.length} turn{history.length !== 1 ? "s" : ""})
                      </div>

                      {/* Display Mode with Ticking Digital Clock */}
                      {durationMode !== "custom" ? (
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border ${
                          timeLeft <= 15
                            ? "bg-red-950/40 text-red-400 border-red-500/30 animate-pulse font-bold"
                            : "bg-stone-900 text-amber-400 border-stone-800"
                        }`}>
                          <Clock className={`h-3 w-3 ${timeLeft <= 15 ? "text-red-400" : "text-amber-500"}`} />
                          <span>Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-stone-900 text-stone-400 border border-stone-800">
                          <Clock className="h-3 w-3 text-stone-550" />
                          <span>Custom mode</span>
                        </div>
                      )}
                    </div>

                    {/* Auto-play and manual advance triggers */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
                          isAutoPlaying
                            ? "bg-amber-600 text-stone-100 hover:bg-amber-500"
                            : "bg-indigo-600 text-stone-100 hover:bg-indigo-500"
                        }`}
                        id="play-pause-simulation-btn"
                        disabled={summaryReport !== null || (durationMode !== "custom" && timeLeft <= 0)}
                        title={summaryReport ? "Simulation finalized. Reset to start a new one." : "Let the AI bots debate continuously!"}
                      >
                        {isAutoPlaying ? (
                          <>
                            <Pause className="h-3 w-3" />
                            Pause Auto
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3" />
                            Auto-Debate
                          </>
                        )}
                      </button>

                      <button
                        onClick={triggerNextAiTurn}
                        className="px-3 py-1.5 rounded-lg text-xs font-mono bg-stone-800 hover:bg-stone-700 text-white flex items-center gap-1 transition-all"
                        id="manual-advance-turn-btn"
                        disabled={isGenerating || isSubmittingUserTurn || summaryReport !== null}
                        title="Simulate only the next speaker statement"
                      >
                        Next Turn
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Transcript Scroll Area */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-stone-950/40 custom-scrollbar" id="transcript-feed">
                    {durationMode !== "custom" && timeLeft <= 0 && (
                      <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-xl mb-4 text-center space-y-2" id="timer-elapsed-notification-banner">
                        <AlertTriangle className="h-5 w-5 text-red-500 mx-auto" />
                        <h4 className="text-xs font-sans font-semibold text-red-400">Debate Timer Limit Elapsed</h4>
                        <p className="text-[11px] text-stone-400 max-w-md mx-auto leading-normal">
                          The requested {totalDuration === 60 ? "1-minute Flash" : totalDuration === 185 ? "3-minute Pro" : `${totalDuration / 60}-minute`} debate duration has completed. You can still review the facts, continue typing educational inquiries, or request the **Arbiter's Verdict summary** to declare the winner.
                        </p>
                      </div>
                    )}

                    {history.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3" id="blank-transcript-state">
                        <Activity className="h-10 w-10 text-stone-600 animate-pulse" />
                        <div className="space-y-1">
                          <p className="text-sm text-stone-300 font-sans">
                            The Arena floor is empty.
                          </p>
                          <p className="text-xs text-stone-500 max-w-sm">
                            Click <strong>Auto-Debate</strong> or <strong>Next Turn</strong> to prompt {proBotName} to generate the opening assertion, or type an argument yourself!
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5" id="history-turns-wrapper">
                        {history.map((turn, index) => {
                          const isPro = turn.speaker === "pro";
                          const isCon = turn.speaker === "con";
                          const isUser = turn.speaker === "user";

                          return (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                              key={turn.id}
                              className={`p-4 rounded-xl border text-xs leading-relaxed space-y-3.5 relative ${
                                isPro
                                  ? "bg-emerald-950/10 border-emerald-500/20"
                                  : isCon
                                  ? "bg-rose-955/10 bg-red-950/10 border-red-500/20"
                                  : "bg-indigo-950/10 border-indigo-500/20"
                              }`}
                              id={`turn-card-${turn.id}`}
                            >
                              {/* Turn identity line */}
                              <div className="flex items-center justify-between border-b border-stone-800/40 pb-2">
                                <div className="flex items-center gap-2">
                                  <div className={`h-2.5 w-2.5 rounded-full ${
                                    isPro ? "bg-emerald-400" : isCon ? "bg-red-400" : "bg-indigo-400"
                                  }`} />
                                  <span className="font-sans font-semibold text-white">
                                    {turn.speakerName}
                                  </span>
                                  {isUser && (
                                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/40 border border-indigo-900/30 text-indigo-300">
                                      Interactive Inquirer
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 text-[10px] font-mono text-stone-500">
                                  <span>Turn #{index + 1}</span>
                                  <span>•</span>
                                  <span>{turn.timestamp}</span>
                                </div>
                              </div>

                              {/* Speach Content text */}
                              <p className="text-stone-300 font-sans text-sm tracking-wide leading-relaxed selection:bg-stone-800">
                                "{turn.text}"
                              </p>

                              {/* Real-Time Score Impact and Fact analysis metrics */}
                              <div className="pt-2.5 border-t border-stone-800/30 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] font-mono">
                                {/* Score calibration */}
                                <div className="flex items-center gap-1.5 text-stone-400">
                                  <span className="text-stone-500">Balance shift:</span>
                                  <span className={`font-semibold ${turn.scoreChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                    {turn.scoreChange >= 0 ? `+${turn.scoreChange}` : turn.scoreChange} points
                                  </span>
                                </div>

                                {/* Fact rating */}
                                <div className="flex items-center gap-1.5 text-stone-400">
                                  <span className="text-stone-500">Truth rating:</span>
                                  <span className={`font-semibold ${
                                    turn.factRating.toLowerCase().includes("10") || turn.factRating.toLowerCase().includes("9")
                                      ? "text-emerald-400"
                                      : turn.factRating.toLowerCase().includes("fake") || turn.factRating.toLowerCase().includes("0")
                                      ? "text-red-400 animate-pulse"
                                      : "text-amber-400"
                                  }`}>
                                    {turn.factRating}
                                  </span>
                                </div>
                              </div>

                              {/* Logical fallacies encountered (if any) */}
                              {turn.logicalFallacies && turn.logicalFallacies.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                  <span className="text-[10px] font-mono text-stone-500 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3 text-red-500" />
                                    Detected Fallacies:
                                  </span>
                                  {turn.logicalFallacies.map((val) => (
                                    <span
                                      key={val}
                                      className="text-[9px] font-mono bg-red-950/45 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded"
                                    >
                                      {val}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Real-time details box: factual analysis / comment or rebuttals */}
                              <div className="bg-stone-900/40 p-2.5 rounded-lg border border-stone-850 space-y-1 text-stone-400">
                                <div className="text-[10px] font-mono text-stone-500 uppercase">
                                  Fact-check commentary
                                </div>
                                <p className="text-[11px] leading-relaxed italic text-stone-300">
                                  {turn.factAnalysis}
                                </p>
                                {turn.moderatorComment && (
                                  <p className="text-[10px] leading-normal text-stone-400 border-t border-stone-800/60 pt-1 mt-1 font-sans">
                                    <strong>Mod comment:</strong> {turn.moderatorComment}
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}

                    {/* Pending state */}
                    {isGenerating && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl border border-stone-800 bg-stone-900/30 flex items-center gap-3"
                        id="generating-turn-loader"
                      >
                        <div className="relative flex h-3.5 w-3.5 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-indigo-500" />
                        </div>
                        <div className="space-y-1 text-xs">
                          <p className="font-mono text-stone-300">
                            {nextSpeaker === "pro" ? proBotName : conBotName} is formulating a rebutting statement...
                          </p>
                          <p className="text-[10px] text-stone-500 font-mono animate-pulse">
                            Analyzing debate context and crafting a response...
                          </p>
                        </div>
                      </motion.div>
                    )}

                    <div ref={chatEndRef} />
                  </div>

                  {/* Transcript Error Banner if API Fails */}
                  {generateError && (
                    <div className="bg-red-950/20 border-t border-b border-red-500/20 px-4 py-3 text-xs text-red-400 flex items-center justify-between">
                      <p className="flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                        {generateError}
                      </p>
                      <button
                        onClick={() => {
                          setGenerateError(null);
                          triggerNextAiTurn();
                        }}
                        className="px-2.5 py-1 bg-red-950/40 text-red-300 border border-red-500/30 rounded-md hover:bg-stone-850 hover:text-white text-[10px] font-mono transition-all"
                      >
                        Retry Turn
                      </button>
                    </div>
                  )}
                                   {/* User Argument submission form */}
                  <div className="border-t border-stone-800/80 bg-stone-950 p-4">
                    <form onSubmit={handleUserSubmit} className="flex gap-2.5 items-stretch" id="user-stance-form">
                      {/* Left icon describing user's role */}
                      <div className="flex flex-col justify-center text-center px-2 font-mono text-[9px] text-stone-500 select-none">
                        <User className="h-4 border border-stone-800 p-0.5 rounded-full w-4 text-indigo-400 mx-auto" />
                        <span className="text-stone-300 mt-1 uppercase text-[8px] font-semibold">Inquire</span>
                      </div>

                      <input
                        type="text"
                        value={userText}
                        onChange={(e) => setUserText(e.target.value)}
                        placeholder="Interject with a point, request fact check, or ask both bots a learning question..."
                        className="flex-1 rounded-xl bg-stone-900 border border-stone-800 px-4 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-stone-600 focus:ring-1 focus:ring-stone-600 focus:bg-stone-900/80 transition-all font-sans"
                        maxLength={400}
                        id="user-argument-input"
                        disabled={isSubmittingUserTurn || isGenerating || summaryReport !== null}
                      />

                      <button
                        type="submit"
                        disabled={!userText.trim() || isSubmittingUserTurn || isGenerating || summaryReport !== null}
                        className="px-4 bg-indigo-600 hover:bg-indigo-500 text-stone-100 font-sans text-xs rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-30 disabled:hover:bg-indigo-600 cursor-pointer disabled:cursor-not-allowed"
                        id="submit-user-turn-btn"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Publish</span>
                      </button>
                    </form>
                    <div className="flex justify-between items-center text-[10px] font-mono text-stone-500 mt-2 px-1">
                      <span>Maximum 400 characters</span>
                      <span>
                        Role: <span className="text-indigo-400 font-semibold">Independent Learner & Dialogue Inquirer</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* VISUAL SCORING SCALE, VOTING AND SUMMARY (5 columns) */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Score tug of war meter */}
                  <ScoreScale
                    proScore={balanceScore}
                    proName={proBotName}
                    conName={conBotName}
                  />

                  {/* Arbiter Summation report control card */}
                  <div className="bg-stone-900 border border-stone-850 rounded-2xl p-5 shadow-lg space-y-4" id="arbiter-verdict-decision-box">
                    <div className="space-y-1">
                      <h3 className="text-sm font-sans font-medium text-stone-200 flex items-center gap-1.5">
                        <Trophy className="h-4.5 w-4.5 text-amber-500" />
                        Supreme Court Verdict Arbiter
                      </h3>
                      <p className="text-xs text-stone-400 leading-normal">
                        Ready to end the struggle? Request the Supreme AI Academic Arbiter to analyze the full dialogue transcript, judge overall logical rigor, point out fallacies, and declare the winner.
                      </p>
                    </div>

                    {history.length < 2 ? (
                      <p className="text-[11px] font-mono text-stone-500 flex items-center gap-2 bg-stone-950 p-3 rounded-xl border border-stone-850">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                        Requires at least 2 turns in history to assemble a detailed academic scorecard.
                      </p>
                    ) : (
                      <div className="pt-2">
                        {!summaryReport ? (
                          <button
                            onClick={requestArbiterVerdict}
                            disabled={isGeneratingSummary || isGenerating}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold shadow transition-all ${
                              isGeneratingSummary
                                ? "bg-stone-800 text-stone-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-stone-100"
                            }`}
                            id="trigger-verdict-btn"
                          >
                            {isGeneratingSummary ? (
                              <>
                                <div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-stone-400 border-opacity-50 inline-block" />
                                Arbitrating Final Scorecard...
                              </>
                            ) : (
                              <>
                                <Trophy className="h-4 w-4" />
                                Finalize Debate & Request Verdict
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="space-y-3.5">
                            <span className="text-xs font-mono text-stone-500 block text-center">
                              Debate finalized. Report available below.
                            </span>
                            <button
                              onClick={() => {
                                setSummaryReport(null);
                                setBalanceScore(50);
                              }}
                              className="w-full text-center py-2.5 bg-stone-850 hover:bg-stone-800 text-stone-400 hover:text-white rounded-xl text-xs font-mono transition-colors"
                              id="discard-summary-btn"
                            >
                              Unlock & Resume Original Debate
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* SUPREME VERDICT ANALYSIS CARD (Revealed when summary is compiled) */}
                  <AnimatePresence>
                    {summaryReport && (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 15 }}
                        className="bg-stone-900 border border-stone-850 rounded-2xl overflow-hidden shadow-2xl space-y-0"
                        id="verdict-report-card"
                      >
                        {/* Summary Header */}
                        <div className="p-5 border-b border-stone-800 bg-stone-950 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-amber-400" />
                            <h3 className="text-sm font-sans font-semibold text-white uppercase tracking-tight">
                              Arbiter's Report Card
                            </h3>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Verdict Official
                          </span>
                        </div>

                        {/* Summary Content Body */}
                        <div className="p-5 space-y-5 text-xs">
                          
                          {/* Winner Spotlight */}
                          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 space-y-1.5">
                            <div className="text-[9px] font-mono uppercase text-amber-400 tracking-wider">
                              Declared Winner
                            </div>
                            <div className="text-base font-sans font-bold text-stone-100 italic" id="verdict-winner">
                              🏆 {summaryReport.winner}
                            </div>
                            <p className="text-xs text-stone-300 leading-normal">
                              {summaryReport.winnerReason}
                            </p>
                          </div>

                          {/* Scores breakdown */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3.5 bg-stone-950 rounded-xl border border-stone-850 space-y-1 text-center">
                              <span className="text-[10px] font-mono text-emerald-400 block uppercase">
                                {proBotName}
                              </span>
                              <div className="text-2xl font-mono font-bold text-white">
                                {summaryReport.proScore}/100
                              </div>
                              <span className="text-[9px] text-stone-500 block leading-none">Rhetoric score</span>
                            </div>

                            <div className="p-3.5 bg-stone-950 rounded-xl border border-stone-850 space-y-1 text-center">
                              <span className="text-[10px] font-mono text-red-400 block uppercase">
                                {conBotName}
                              </span>
                              <div className="text-2xl font-mono font-bold text-white">
                                {summaryReport.conScore}/100
                              </div>
                              <span className="text-[9px] text-stone-500 block leading-none">Rhetoric score</span>
                            </div>
                          </div>

                          {/* Technical critique logs */}
                          <div className="space-y-3 pt-2">
                            <div>
                              <h4 className="text-[11px] font-mono text-stone-400 uppercase tracking-widest mb-1">
                                {proBotName} Proponent Critique
                              </h4>
                              <p className="text-stone-300 bg-stone-950 p-3 rounded-lg border border-stone-850/60 leading-normal font-sans text-[11px]">
                                {summaryReport.proCritique}
                              </p>
                            </div>

                            <div>
                              <h4 className="text-[11px] font-mono text-stone-400 uppercase tracking-widest mb-1">
                                {conBotName} Opponent Critique
                              </h4>
                              <p className="text-stone-300 bg-stone-950 p-3 rounded-lg border border-stone-850/60 leading-normal font-sans text-[11px]">
                                {summaryReport.conCritique}
                              </p>
                            </div>

                            {/* User stance evaluation feedback */}
                            <div>
                              <h4 className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest mb-1">
                                Participant Involvement Critique
                              </h4>
                              <p className="text-stone-300 bg-stone-950 p-3 rounded-lg border border-stone-850/60 leading-normal font-sans text-[11px]">
                                {summaryReport.userContributionAnalysis}
                              </p>
                            </div>
                          </div>

                          {/* Notable/Chaotic Moments timeline list */}
                          {summaryReport.notableMoments && summaryReport.notableMoments.length > 0 && (
                            <div className="space-y-2.5 pt-2">
                              <h4 className="text-[11px] font-mono text-stone-400 uppercase tracking-widest">
                                Highlights & Notable Turns
                              </h4>
                              <div className="space-y-2">
                                {summaryReport.notableMoments.map((moment, idx) => (
                                  <div
                                    key={idx}
                                    className="p-2.5 bg-stone-950 rounded-lg border border-stone-850/40 text-[11px]"
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-sans font-semibold text-stone-200">
                                        💡 {moment.moment}
                                      </span>
                                      <span className="text-[9px] font-mono uppercase bg-stone-900 border border-stone-800 px-1.5 rounded text-stone-400">
                                        {moment.speaker}
                                      </span>
                                    </div>
                                    <p className="text-stone-400 leading-normal italic font-sans text-[10.5px]">
                                      {moment.description}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Configuration modal panel */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        setSettings={setSettings}
        aegisName={proBotName}
        setAegisName={setProBotName}
        vesperName={conBotName}
        setVesperName={setConBotName}
      />

      {/* Aesthetic decorative footer */}
      <footer className="border-t border-stone-900 bg-stone-950 py-4 text-center text-[10px] font-mono text-stone-500">
        AI Debate Arena • Powered by Google Gemini AI • Built with React & TypeScript
      </footer>
    </div>
  );
}
