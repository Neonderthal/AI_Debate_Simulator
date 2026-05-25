export type DebateDurationMode = "flash" | "pro" | "ultra" | "custom";

export interface Turn {
  id: string;
  speaker: "pro" | "con" | "user";
  speakerName: string;
  text: string;
  scoreChange: number;
  factRating: string;
  factAnalysis: string;
  logicalFallacies: string[];
  moderatorComment?: string;
  timestamp: string;
}

export interface NotableMoment {
  moment: string;
  description: string;
  speaker: string;
}

export interface SummaryReport {
  winner: string;
  winnerReason: string;
  proScore: number;
  conScore: number;
  proCritique: string;
  conCritique: string;
  userContributionAnalysis: string;
  notableMoments: NotableMoment[];
}

export interface DebateSettings {
  chaoticMode: boolean; // Surprise toggle - false by default, can be toggled in settings
  aiStiffness: number; // 0 to 100
  speakerAegisVoice: string; // prebuilt voice config / style details
  speakerVesperVoice: string;
  ttsEnabled: boolean; // Text-to-Speech toggle
  ttsAutoRead: boolean; // Auto-read new AI arguments
}
