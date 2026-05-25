import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialization of Gemini client helper
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required configuration. Please set it in your environment.");
    }
    aiClient = new GoogleGenAI({ 
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

// Resilient helper to execute text/JSON generations with automatic fallback models to prevent 429 quota errors on free tier.
async function generateContentWithFallback(params: {
  contents: any;
  config: any;
}): Promise<{ text: string }> {
  // Priority: 3.5-flash -> 3.1-flash-lite (generous quota) -> gemini-flash-latest
  const models = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
  let lastError: any = null;

  for (const modelName of models) {
    try {
      console.log(`[Gemini Request] Attempting generateContent with model: "${modelName}"`);
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: modelName,
        contents: params.contents,
        config: params.config,
      });

      if (response && response.text) {
        console.log(`[Gemini Request] Succeeded using model: "${modelName}"`);
        return { text: response.text };
      }
      throw new Error("Received empty or malformed response text.");
    } catch (err: any) {
      console.warn(`[Gemini Fallback] Model "${modelName}" request failed:`, err.message || err);
      lastError = err;

      const isQuotaOr429 = 
        err.status === 429 || 
        (err.message && (
          err.message.includes("429") ||
          err.message.includes("quota") ||
          err.message.includes("QUOTA_EXCEEDED") ||
          err.message.includes("RESOURCE_EXHAUSTED") ||
          err.message.includes("Limit exceeded")
        ));
      
      if (isQuotaOr429) {
        // Mini backoff sleep before model switch
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  throw lastError || new Error("All model fallback pathways were exhausted due to quota/connection errors.");
}

// API: Check status of API keys or server health
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

// API: Generate the next AI turn in the debate
app.post("/api/debate/next-turn", async (req, res) => {
  const { topic, history, nextSpeaker, chaoticMode, durationMode } = req.body;

  if (!topic) {
    return res.status(400).json({ error: "Topic is required" });
  }
  if (!nextSpeaker || (nextSpeaker !== "pro" && nextSpeaker !== "con")) {
    return res.status(400).json({ error: "nextSpeaker must be 'pro' or 'con'" });
  }

  try {
    // Check key availability first to trigger immediate graceful fallback if missing
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not set.");
    }

    const ai = getGeminiClient();
    
    // Choose persona descriptions
    const proPersona = "AI Proponent (Stance: FOR the topic). Construct persuasive, highly passionate arguments aiming to validate the core theme incorporating deep human empathy and conviction.";
    const conPersona = "AI Opponent (Stance: AGAINST the topic). Construct sharp, critical, skeptical rebuttals designed to challenge assertions with raw human focus and rhetorical strength.";

    // Solve for word limits and requirements based on mode
    let wordLimitRule = "";
    let maxWordsLabel = "50";

    const activeMode = durationMode || "pro";
    if (activeMode === "flash") {
      wordLimitRule = "Keep the text extremely short, strictly between 15 and 20 words maximum per argument! Under no circumstance exceed 20 words.";
      maxWordsLabel = "15 to 20 words";
    } else if (activeMode === "ultra") {
      wordLimitRule = "Keep the text strictly between 50 and 70 words maximum per argument! Under no circumstance exceed 70 words.";
      maxWordsLabel = "50 to 70 words";
    } else if (activeMode === "custom") {
      wordLimitRule = "Keep the text under 50 words maximum per argument. There is no strict lower bound on words.";
      maxWordsLabel = "under 50 words";
    } else {
      // Default: "pro"
      wordLimitRule = "Keep the text strictly between 40 and 50 words maximum per argument! Under no circumstance exceed 50 words.";
      maxWordsLabel = "40 to 50 words";
    }

    let styleInstruction = "";
    if (chaoticMode) {
      styleInstruction = `
[CHAOTIC MODE IS ACTIVE]
You are in a highly heated, frustrated, and emotional state of disagreement. You MUST:
1. Express intense human emotions—anger, frustration, impatience, or heavy sarcasm—arguing with extreme raw conviction but suffering emotional slips of the tongue or wild exaggerations.
2. Deploy biased, overstated, or incorrect assertions that a heated speaker might throw out in a tense moment (e.g., highly skewed percentages, desperate generalizations).
3. Do NOT make bizarre surreal jokes about irrelevant things (like bread or squirrels). Keep it strictly on-topic, but let tempers flare! Call out the opponent's style directly.
4. ${wordLimitRule}
`;
    } else {
      styleInstruction = `
[REGULAR DEBATE MODE]
You are a highly intellectual, eloquent, yet profoundly empathetic debater. You MUST:
1. Focus on persuasive arguments infused with real human emotion, passion, and lived experiences rather than cold, robotic, mechanical facts. 
2. Address previous points directly with snappy, conversational counterarguments.
3. ${wordLimitRule}
`;
    }

    const speakerLabel = nextSpeaker === "pro" ? "FOR (Proponent)" : "AGAINST (Opponent)";
    const speakerRoleText = nextSpeaker === "pro" ? proPersona : conPersona;

    // Formulate previous turns representation
    const recentHistory = (history || []).slice(-8);
   const formattedHistory = recentHistory.map((turn: any) => {
      let roleDisplay = "";
      if (turn.speaker === "pro") roleDisplay = "AI Proponent (FOR)";
      else if (turn.speaker === "con") roleDisplay = "AI Opponent (AGAINST)";
      else if (turn.speaker === "user") {
        roleDisplay = `User Audience Question/Point`;
      }
      return `Speaker: ${roleDisplay}\nArgument: "${turn.text}"`;
    }).join("\n\n");

    const systemInstruction = `You are a professional AI Debate Simulator bot playing the role of ${speakerRoleText}.
The topic is: "${topic}"

Your current objective: Write the next turn's response as the ${speakerLabel}.

Style and Rules:
${styleInstruction}

Instructions for JSON output structure:
Return a JSON object conforming exactly to the following properties:
- "argument": Write a short, passionate, and highly engaging argument (conforming STRICTLY to the word limit rules: ${maxWordsLabel}) in character.
- "scoreChange": Estimate how much this turn shifts the balance of the debate. Output an integer between -10 and +10, where:
    * Positive is a shift in favor of the Proponent (FOR).
    * Negative is a shift in favor of the Opponent (AGAINST).
    * If this speaker makes an incredible point, set high absolute value. If they stumble, set low.
- "analysis": A quick objective critique of the emotional appeal and logical validity (1 sentence).
- "factRating": A brief, professional string rating factual validity (e.g., "9/10", "3/10 (Heated Error)", etc.).
- "factAnalysis": Comment in 1 sentence on the truthfulness of their claims. If chaoticMode is on, highlight how their frustration led to the slip of fact.
- "logicalFallacies": Any logical fallacies committed (e.g. "Ad Hominem", "Appeal to Emotion", "Overgeneralization" or [] if none).`;

    const userPrompt = `Here is the current transcript of the debate:\n\n${
      formattedHistory || "(Debate has just begun. This is the opening statement.)"
    }\n\nGenerate the next turn's JSON response for the ${speakerLabel}.`;

    const response = await generateContentWithFallback({
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            argument: {
              type: Type.STRING,
              description: "The next spoken argument text designed to persuade the audience.",
            },
            scoreChange: {
              type: Type.INTEGER,
              description: "The point value shift (-10 to +10) towards pro (positive) or against (negative).",
            },
            analysis: {
              type: Type.STRING,
              description: "Neutral moderator's commentary of this argument's rhetorical effectiveness.",
            },
            factRating: {
              type: Type.STRING,
              description: "Score representing factual accuracy (e.g. '10/10' or '0/10 (Whimsical)').",
            },
            factAnalysis: {
              type: Type.STRING,
              description: "Analysis of the specific claims or made-up facts presented.",
            },
            logicalFallacies: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
              description: "Any fallacy types encountered (e.g. 'Ad Hominem', 'Appeal to Authority').",
            },
          },
          required: ["argument", "scoreChange", "analysis", "factRating", "factAnalysis", "logicalFallacies"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Received empty response from Gemini API");
    }

    const parsedResponse = JSON.parse(resultText.trim());
    res.json(parsedResponse);
  } catch (err: any) {
    console.error("Gemini API failed on next-turn:", err.message || err);
    return res.status(503).json({ 
      error: "AI service unavailable. Please try again in a moment.",
      details: err.message 
    });
  }
});

// API: Process user contributions and auto-analyze their factuality/fallacies
app.post("/api/debate/user-turn", async (req, res) => {
  const { topic, history, text } = req.body;

  if (!topic || !text) {
    return res.status(400).json({ error: "Topic and user text are required" });
  }

  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const systemInstruction = `You are an elite, objective debate moderator and fact checker.
The current debate topic is: "${topic}"
The user is participating as an independent inquirer and audience learner. They are submitting a question or point of view mid-debate to deepen their understanding of the topic.

Analyze the user's text. Your task is to provide real-time scoring and transcript analysis for this user contribution to assist with their learning. Output a JSON object.

JSON Schema format requirements:
- "scoreChange": Estimate how much this user statement shifts the debate balance based on the point raised. Output an integer between -10 and +10 (positive = shifts to Pro, negative = shifts to Against, 0 = neutral/exploratory).
- "factRating": A string rating (e.g., "8/10", "9/10", "N/A" for pure rhetoric/questions).
- "factAnalysis": A professional check of the argument's credibility, verifying logical clarity (1-2 sentences).
- "logicalFallacies": An array of strings representing any fallacies found in user's statement.
- "moderatorComment": A constructive moderator response designed to coach the user (e.g., "A powerful inquiry that challenges the empirical basis of Aegis's claim.") (1 sentence).`;

    const userPrompt = `Analyze the user's latest question/point of view: "${text}"
Debate history so far:\n${(history || []).map((h: any) => `${h.speakerName}: ${h.text}`).join("\n")}`;

    const response = await generateContentWithFallback({
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scoreChange: {
              type: Type.INTEGER,
            },
            factRating: {
              type: Type.STRING,
            },
            factAnalysis: {
              type: Type.STRING,
            },
            logicalFallacies: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            moderatorComment: {
              type: Type.STRING,
            },
          },
          required: ["scoreChange", "factRating", "factAnalysis", "logicalFallacies", "moderatorComment"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from Gemini API");
    }

    res.json(JSON.parse(resultText.trim()));
  } catch (err: any) {
    console.error("Gemini API failed on user-turn:", err.message || err);
    return res.status(503).json({ 
      error: "Could not analyze your input right now. Please try again.",
      details: err.message 
    });
  }
});

// API: Final Transcript Analysis & Scoreboard Summary
app.post("/api/debate/summary", async (req, res) => {
  const { topic, history, chaoticMode } = req.body;

  if (!topic || !history || !Array.isArray(history) || history.length === 0) {
    return res.status(400).json({ error: "Topic and non-empty history are required for summary." });
  }

  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const formattedHistory = history.map((t: any, idx: number) => {
      const sp = t.speaker === "pro" ? "Proponent bot (Aegis)" : t.speaker === "con" ? "Opponent bot (Vesper)" : `User Audience (Question/Point)`;
      return `Turn #${idx + 1} - ${sp}: "${t.text}" [Fact rating: ${t.factRating || "N/A"}]`;
    }).join("\n");

    const systemInstruction = `You are a Chief Academic Arbiter of the Supreme AI Debate Arena.
Analyze the complete debate transcript below on the topic: "${topic}".
Provide a thorough, highly engaging academic report card summary in JSON format.

If chaoticMode (Chaotic Argumentation) was active, note that tempers flared with human-like heated emotions, impatience, frustration, sarcasm, and slips of facts in the heat of the moment, rather than constructive logic. Report on how those flare-ups affected persuasion.

Return a JSON object conforming exactly to this structure:
- "winner": "Proponent AI (FOR)" | "Opponent AI (AGAINST)" | "Draw"
- "winnerReason": "A 1-2 sentence detailed academic justification of which side argued more compellingly, backing up with logic and passion, or highlighting how the other side lost composure if Chaotic Mode was on."
- "proScore": Integer out of 100 representing overall performance of Proponent.
- "conScore": Integer out of 100 representing overall performance of Opponent.
- "proCritique": "A professional paragraph reviewing the Proponent's debate strengths, key arguments, and highlights."
- "conCritique": "A professional paragraph reviewing the Opponent's debate strengths, key arguments, and highlights."
- "userContributionAnalysis": "Feedback on the user's role as an independent observer offering critical cues. Review how their queries or assertions enriched the overall debate or added learning value."
- "notableMoments": An array of objects, each representing a standout argument, funny citation, or critical turning point:
    * "moment": "Brief label or title"
    * "description": "Short explanation of why it was notable"
    * "speaker": "Aegis (Pro)" | "Vesper (Con)" | "User"`;

    const response = await generateContentWithFallback({
      contents: `Perform final transcript analysis for this debate:\n\nTopic: "${topic}"\nChaotic Mode: ${chaoticMode ? "Active" : "Inactive"}\n\nHistory:\n${formattedHistory}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            winner: { type: Type.STRING },
            winnerReason: { type: Type.STRING },
            proScore: { type: Type.INTEGER },
            conScore: { type: Type.INTEGER },
            proCritique: { type: Type.STRING },
            conCritique: { type: Type.STRING },
            userContributionAnalysis: { type: Type.STRING },
            notableMoments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  moment: { type: Type.STRING },
                  description: { type: Type.STRING },
                  speaker: { type: Type.STRING },
                },
                required: ["moment", "description", "speaker"],
              },
            },
          },
          required: [
            "winner",
            "winnerReason",
            "proScore",
            "conScore",
            "proCritique",
            "conCritique",
            "userContributionAnalysis",
            "notableMoments",
          ],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Failed to receive transcript summary from Gemini API");
    }

    res.json(JSON.parse(resultText.trim()));
  } catch (err: any) {
    console.error("Gemini API failed on summary:", err.message || err);
    return res.status(503).json({ 
      error: "Could not generate debate summary. Please try again.",
      details: err.message 
    });
  }
});

// Configure Vite middleware or serve static production bundle
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Debate Simulator API & App running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
