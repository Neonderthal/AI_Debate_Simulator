import { motion } from "motion/react";
import { X, ShieldAlert, Zap, Circle as HelpCircle, Volume2, VolumeX } from "lucide-react";
import { DebateSettings } from "../types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DebateSettings;
  setSettings: (settings: DebateSettings) => void;
  aegisName: string;
  setAegisName: (name: string) => void;
  vesperName: string;
  setVesperName: (name: string) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  setSettings,
  aegisName,
  setAegisName,
  vesperName,
  setVesperName,
}: SettingsModalProps) {
  if (!isOpen) return null;

  const toggleChaotic = () => {
    setSettings({
      ...settings,
      chaoticMode: !settings.chaoticMode,
    });
  };

  const toggleTTS = () => {
    setSettings({
      ...settings,
      ttsEnabled: !settings.ttsEnabled,
    });
  };

  const toggleAutoRead = () => {
    setSettings({
      ...settings,
      ttsAutoRead: !settings.ttsAutoRead,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60"
      id="settings-modal-overlay"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg overflow-hidden border bg-stone-900 border-stone-850 rounded-2xl shadow-2xl text-stone-100"
        id="settings-modal-box"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 p-5 bg-stone-950">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-sans font-medium tracking-tight text-white">
              Simulator Configuration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
            id="close-settings-btn"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Chaotic Argumentation Module (Surprise Mode requested) */}
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/20">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-rose-500 animate-pulse" />
                  <label className="text-sm font-medium text-rose-400 font-sans">
                    Chaotic Argumentation Mode
                  </label>
                </div>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Forces AI bots to express intense, heated human emotions—impatience, frustration, and sharp sarcasm—leading to realistic slips of the tongue and exaggerated assertions under pressure.
                </p>
              </div>
              <button
                type="button"
                onClick={toggleChaotic}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.chaoticMode ? "bg-rose-600" : "bg-stone-700"
                }`}
                id="chaotic-mode-toggle"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    settings.chaoticMode ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            {settings.chaoticMode && (
              <p className="mt-3 text-xs font-mono text-red-300 bg-red-900/20 p-2 rounded border border-red-500/30">
                ⚡ Status: Active. Tempers will flare! Bots will argue with human-like passion, impatience, and biased exaggerations.
              </p>
            )}
          </div>

          {/* Persona Configuration */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-stone-400">
              Speaker Identities
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-stone-300 font-sans">
                  Proponent (FOR) Name
                </label>
                <input
                  type="text"
                  value={aegisName}
                  onChange={(e) => setAegisName(e.target.value)}
                  placeholder="Aegis"
                  className="w-full rounded-lg bg-stone-950 border border-stone-800 p-2.5 text-xs text-stone-100 focus:outline-none focus:border-stone-600 focus:ring-1 focus:ring-stone-600"
                  id="aegis-name-input"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-stone-300 font-sans">
                  Opponent (AGAINST) Name
                </label>
                <input
                  type="text"
                  value={vesperName}
                  onChange={(e) => setVesperName(e.target.value)}
                  placeholder="Vesper"
                  className="w-full rounded-lg bg-stone-950 border border-stone-800 p-2.5 text-xs text-stone-100 focus:outline-none focus:border-stone-600 focus:ring-1 focus:ring-stone-600"
                  id="vesper-name-input"
                />
              </div>
            </div>
          </div>

          {/* Text-to-Speech Settings */}
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {settings.ttsEnabled ? (
                    <Volume2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <VolumeX className="h-4 w-4 text-stone-500" />
                  )}
                  <label className="text-sm font-medium text-emerald-400 font-sans">
                    Text-to-Speech
                  </label>
                </div>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Enable voice narration for AI arguments. Each speaker has a distinct voice profile for a more engaging debate experience.
                </p>
              </div>
              <button
                type="button"
                onClick={toggleTTS}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.ttsEnabled ? "bg-emerald-600" : "bg-stone-700"
                }`}
                id="tts-toggle"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    settings.ttsEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {settings.ttsEnabled && (
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-stone-300">Auto-read arguments</p>
                    <p className="text-[10px] text-stone-500">Automatically speak new AI arguments during debate</p>
                  </div>
                  <button
                    type="button"
                    onClick={toggleAutoRead}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      settings.ttsAutoRead ? "bg-emerald-600" : "bg-stone-700"
                    }`}
                    id="auto-read-toggle"
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        settings.ttsAutoRead ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="bg-stone-900/50 p-3 rounded-lg border border-stone-800 text-[10px] text-stone-400">
                  <p className="mb-1.5 font-medium text-stone-300">Voice Profiles:</p>
                  <div className="flex gap-4">
                    <div>
                      <span className="text-emerald-400">{aegisName || "Aegis"}:</span>
                      <span className="ml-1">Clear, warm, academic tone</span>
                    </div>
                    <div>
                      <span className="text-red-400">{vesperName || "Vesper"}:</span>
                      <span className="ml-1">Deep, authoritative, skeptical tone</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-stone-800/60 pt-4 space-y-3 text-xs text-stone-400 font-sans leading-relaxed">
            <div className="flex gap-2">
              <HelpCircle className="h-4 w-4 text-stone-500 shrink-0" />
              <div>
                <p>
                  <strong>Active Engagement:</strong> Insert statements or ask critical questions in-between AI turns to test your assertions and learn the nuances of the debate.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-stone-800 bg-stone-950">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-200 hover:text-white transition-colors"
            id="close-settings-footer-btn"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
