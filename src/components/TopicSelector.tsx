import { useState } from "react";
import { motion } from "motion/react";
import { MessageSquare, ArrowRight, HelpCircle, AlertCircle, Sparkles, Timer, Zap, Clock, ShieldAlert } from "lucide-react";
import { PRESET_TOPICS, PresetTopic } from "../utils/defaultTopics";
import { DebateDurationMode } from "../types";

interface TopicSelectorProps {
  onStartDebate: (topic: string, durationMode: DebateDurationMode, proBotName: string, conBotName: string) => void;
  settingsAegisName: string;
  settingsVesperName: string;
}

export default function TopicSelector({ onStartDebate, settingsAegisName, settingsVesperName }: TopicSelectorProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESET_TOPICS[0].id);
  const [customTopic, setCustomTopic] = useState<string>("");
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [durationMode, setDurationMode] = useState<DebateDurationMode>("pro");

  // Get current selected preset topic details
  const currentPreset = PRESET_TOPICS.find((t) => t.id === selectedPresetId) || PRESET_TOPICS[0];

  const handleStart = () => {
    const topicText = isCustomMode ? customTopic.trim() : currentPreset.title;
    if (!topicText) {
      alert("Please provide a topic first.");
      return;
    }

    const proName = settingsAegisName || (isCustomMode ? "Aegis" : currentPreset.defaultProName);
    const conName = settingsVesperName || (isCustomMode ? "Vesper" : currentPreset.defaultConName);

    onStartDebate(topicText, durationMode, proName, conName);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 py-4 px-1" id="topic-selector-container">
      {/* Intro text */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Sparkles className="h-3 w-3" />
          Twin-AI Logic Playground
        </div>
        <h1 className="text-3xl md:text-4xl font-sans font-semibold tracking-tight text-stone-100">
          AI Debate Arena
        </h1>
        <p className="text-sm text-stone-400 max-w-xl mx-auto">
          Set up a topic, choose the duration parameters, and view the AI bots clash in real-time. Feel free to ask questions or submit your points of view during the debate to learn!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Topic Setting Column (7 cols in desktop) */}
        <div className="lg:col-span-7 bg-stone-900 border border-stone-850 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-stone-800/60 pb-4">
            <h2 className="text-base font-sans font-medium text-stone-200 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-indigo-400" />
              1. Choose a Debate Topic
            </h2>

            {/* Toggle custom vs preset */}
            <div className="flex gap-1.5 bg-stone-950 p-1 rounded-lg border border-stone-800">
              <button
                onClick={() => setIsCustomMode(false)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  !isCustomMode
                    ? "bg-stone-800 text-stone-100 shadow"
                    : "text-stone-400 hover:text-stone-200"
                }`}
                id="preset-mode-tab"
              >
                Presets
              </button>
              <button
                onClick={() => setIsCustomMode(true)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  isCustomMode
                    ? "bg-stone-800 text-stone-100 shadow"
                    : "text-stone-400 hover:text-stone-200"
                }`}
                id="custom-mode-tab"
              >
                Custom Topic
              </button>
            </div>
          </div>

          {!isCustomMode ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRESET_TOPICS.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedPresetId(topic.id)}
                    className={`text-left p-3.5 rounded-xl border text-xs transition-all flex flex-col justify-between h-28 ${
                      selectedPresetId === topic.id
                        ? "bg-stone-800/40 border-stone-600 text-stone-100 shadow-md ring-1 ring-stone-700"
                        : "bg-stone-950/40 border-stone-850 text-stone-400 hover:bg-stone-900/40 hover:text-stone-200"
                    }`}
                    id={`preset-${topic.id}`}
                  >
                    <div>
                      <span className="inline-block text-[10px] font-mono uppercase bg-stone-800 px-1.5 py-0.5 rounded text-stone-400 mb-1.5">
                        {topic.category}
                      </span>
                      <h3 className="font-sans font-medium line-clamp-2 text-stone-200">
                        {topic.title}
                      </h3>
                    </div>
                  </button>
                ))}
              </div>

              {/* Preset description details card */}
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                key={selectedPresetId}
                className="bg-stone-950 p-4 rounded-xl border border-stone-850 space-y-2 text-xs"
              >
                <div className="text-stone-300 leading-relaxed">
                  {currentPreset.description}
                </div>
                <div className="flex gap-4 pt-1.5 text-stone-400 font-mono text-[10px] border-t border-stone-900">
                  <div>
                    <span className="text-emerald-500">PRO bot:</span> {settingsAegisName || currentPreset.defaultProName}
                  </div>
                  <div>
                    <span className="text-red-400">CON bot:</span> {settingsVesperName || currentPreset.defaultConName}
                  </div>
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-xs text-stone-400 font-sans">
                Type your custom topic to debate:
              </label>
              <textarea
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="E.g., Should human cloning be legal for medical therapy purposes?"
                className="w-full h-32 rounded-xl bg-stone-950 border border-stone-800 p-3.5 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-stone-600 focus:ring-1 focus:ring-stone-600 resize-none leading-relaxed"
                id="custom-topic-textarea"
              />
              <p className="text-[10px] text-stone-500 flex items-center gap-1 font-mono">
                <AlertCircle className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                Keep topics binary (pro vs con friendly) for optimal simulation outcomes.
              </p>
            </div>
          )}
        </div>

        {/* debate limit duration configuration (5 cols in desktop) */}
        <div className="lg:col-span-5 bg-stone-900 border border-stone-850 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-stone-800/60 pb-4">
            <h2 className="text-base font-sans font-medium text-stone-200 flex items-center gap-2">
              <Timer className="h-5 w-5 text-indigo-400" />
              2. Choose Debate Duration
            </h2>
          </div>

          <div className="space-y-3.5">
            {/* Flash Mode Option */}
            <button
              onClick={() => setDurationMode("flash")}
              className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all flex items-start gap-3 relative ${
                durationMode === "flash"
                  ? "bg-amber-950/20 border-amber-500/50 text-stone-100 shadow-sm"
                  : "bg-stone-950/40 border-stone-850 text-stone-400 hover:bg-stone-900/40"
              }`}
              id="duration-option-flash"
            >
              <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                durationMode === "flash" ? "border-amber-500 bg-amber-500/20" : "border-stone-700"
              }`}>
                {durationMode === "flash" && <div className="h-2 w-2 rounded-full bg-amber-400" />}
              </div>
              <div className="space-y-1">
                <h3 className="font-sans font-medium text-stone-200 flex items-center gap-1.5">
                  Flash (1 min)
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">FASTEST</span>
                </h3>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  High-speed verbal sparring. Snappy, punchy replies restricted strictly to 15-20 words per argument.
                </p>
              </div>
            </button>

            {/* Pro Mode Option */}
            <button
              onClick={() => setDurationMode("pro")}
              className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all flex items-start gap-3 relative ${
                durationMode === "pro"
                  ? "bg-emerald-950/20 border-emerald-500/50 text-stone-100 shadow-sm"
                  : "bg-stone-950/40 border-stone-850 text-stone-400 hover:bg-stone-900/40"
              }`}
              id="duration-option-pro"
            >
              <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                durationMode === "pro" ? "border-emerald-500 bg-emerald-500/20" : "border-stone-700"
              }`}>
                {durationMode === "pro" && <div className="h-2 w-2 rounded-full bg-emerald-400" />}
              </div>
              <div className="space-y-1">
                <h3 className="font-sans font-medium text-stone-200 flex items-center gap-1.5">
                  Pro (3 min)
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">STANDARD</span>
                </h3>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  Regular intellectual debate. Balanced 40-50 words per argument for clear rhetorical pacing.
                </p>
              </div>
            </button>

            {/* Ultra Mode Option */}
            <button
              onClick={() => setDurationMode("ultra")}
              className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all flex items-start gap-3 relative ${
                durationMode === "ultra"
                  ? "bg-indigo-950/20 border-indigo-500/50 text-stone-100 shadow-sm"
                  : "bg-stone-950/40 border-stone-850 text-stone-400 hover:bg-stone-900/40"
              }`}
              id="duration-option-ultra"
            >
              <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                durationMode === "ultra" ? "border-indigo-500 bg-indigo-500/20" : "border-stone-700"
              }`}>
                {durationMode === "ultra" && <div className="h-2 w-2 rounded-full bg-indigo-400" />}
              </div>
              <div className="space-y-1">
                <h3 className="font-sans font-medium text-stone-200 flex items-center gap-1.5">
                  Ultra (5 min)
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400">MAX DEPTH</span>
                </h3>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  Extended deliberation form. High academic depth of 50-70 words per turn allowing compound points.
                </p>
              </div>
            </button>

            {/* Custom Option */}
            <button
              onClick={() => setDurationMode("custom")}
              className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all flex items-start gap-3 relative ${
                durationMode === "custom"
                  ? "bg-indigo-950/20 border-indigo-500/30 text-stone-100 shadow-sm"
                  : "bg-stone-950/40 border-stone-850 text-stone-400 hover:bg-stone-900/40"
              }`}
              id="duration-option-custom"
            >
              <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                durationMode === "custom" ? "border-indigo-500 bg-indigo-500/20" : "border-stone-700"
              }`}>
                {durationMode === "custom" && <div className="h-2 w-2 rounded-full bg-indigo-400" />}
              </div>
              <div className="space-y-1">
                <h3 className="font-sans font-medium text-stone-200 flex items-center gap-1.5">
                  Custom
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-stone-800 text-stone-400">UNLIMITED</span>
                </h3>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  Infinite debate without timer constraints. Bots will restrict themselves to 50 words per argument.
                </p>
              </div>
            </button>
          </div>

          <div className="pt-2 border-t border-stone-800/40">
            <button
              onClick={handleStart}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-stone-100 hover:bg-white text-stone-950 text-xs font-semibold rounded-xl transition-all shadow-md active:scale-[0.98]"
              id="start-debate-action"
            >
              Start AI Simulation
              <ArrowRight className="h-4 w-4 text-stone-950" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
