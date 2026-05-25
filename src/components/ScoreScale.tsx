import { motion } from "motion/react";
import { Scale, ArrowLeftRight } from "lucide-react";
interface ScoreScaleProps {
  proScore: number; // 0 to 100, 50 is center neutral
  proName: string;
  conName: string;
}

export default function ScoreScale({
  proScore,
  proName,
  conName,
}: ScoreScaleProps) {
  // Constrain scale
  const proPercent = Math.max(0, Math.min(100, proScore));
  const conPercent = 100 - proPercent;

  // Derive title description of current balance state
  let statusText = "Debate is perfectly balanced";
  let statusColor = "text-indigo-400";
  if (proPercent > 65) {
    statusText = `${proName} is dominating the argument!`;
    statusColor = "text-emerald-400";
  } else if (proPercent > 53) {
    statusText = `${proName} has a slight lead`;
    statusColor = "text-emerald-500/80";
  } else if (conPercent > 65) {
    statusText = `${conName} is dominating the argument!`;
    statusColor = "text-red-400";
  } else if (conPercent > 53) {
    statusText = `${conName} has a slight lead`;
    statusColor = "text-red-500/80";
  }

  return (
    <div className="bg-stone-900 border border-stone-850 rounded-2xl p-5 shadow-lg space-y-5" id="score-scale-box">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-stone-800/50 pb-3">
        <div className="space-y-1">
          <div className="text-xs font-mono uppercase bg-stone-950 text-stone-400 px-2 py-0.5 rounded inline-flex items-center gap-1">
            <Scale className="h-3.5 w-3.5 text-indigo-400" />
            Live Balance Meter
          </div>
          <p className={`text-sm font-sans font-medium ${statusColor}`}>
            {statusText}
          </p>
        </div>

        {/* Current user alignment indicator */}
        <div className="text-[11px] font-mono whitespace-nowrap bg-stone-950 px-2.5 py-1 rounded border border-stone-800 text-indigo-400">
          ● Interactive Learner Mode
        </div>
      </div>

      {/* Main progress tug-of-war */}
      <div className="space-y-2">
        <div className="flex justify-between items-end text-xs font-mono text-stone-400 px-1">
          <div className="text-left">
            <span className="text-stone-500 block text-[10px] uppercase">PRO side</span>
            <span className="font-semibold text-emerald-400">{proName}</span>
          </div>

          <div className="text-center font-semibold text-indigo-300 bg-stone-950/80 px-2.5 py-1 rounded border border-stone-850 flex items-center gap-1.5 text-[11px]">
            <ArrowLeftRight className="h-3.5 w-3.5 text-indigo-400" />
            {proPercent}% vs {conPercent}%
          </div>

          <div className="text-right">
            <span className="text-stone-500 block text-[10px] uppercase">CON side</span>
            <span className="font-semibold text-red-400">{conName}</span>
          </div>
        </div>

        {/* The slider visual bar */}
        <div className="h-3.5 w-full bg-stone-950 rounded-full overflow-hidden flex p-[2px] border border-stone-800">
          <motion.div
            animate={{ width: `${proPercent}%` }}
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-l-full"
            transition={{ type: "spring", stiffness: 60, damping: 15 }}
          />
          {/* Neutral center notch separator */}
          <div className="w-[3px] bg-indigo-500/80 z-10 opacity-60 self-stretch" style={{ marginLeft: "-2px" }} />
          <motion.div
            animate={{ width: `${conPercent}%` }}
            className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-r-full"
            transition={{ type: "spring", stiffness: 60, damping: 15 }}
          />
        </div>
      </div>
    </div>
  );
}
