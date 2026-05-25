# AIDebateSim
AI powered debate simulator built with React, TypeScript and Google Gemini
# AI Debate Arena 🎯

A real-time AI-powered debate simulator where two AI agents argue opposing sides of any topic. Built with React, TypeScript, Express, and Google Gemini AI.

## 🔗 Live Demo
[ai-debate-simulator-py9z.onrender.com](https://ai-debate-simulator-py9z.onrender.com)

## ✨ Features
- **Any topic** — choose from presets or enter a custom debate topic
- **Two AI agents** — Aegis (FOR) vs Vesper (AGAINST) argue in real-time
- **Live scoring** — balance meter shifts with every argument
- **Chaotic Mode** — AIs argue with heated emotions and exaggerations
- **User participation** — interject with your own points mid-debate
- **Fact checking** — every argument gets rated for factual accuracy
- **Logical fallacy detection** — identifies Ad Hominem, Straw Man etc.
- **Arbiter Verdict** — AI judge declares a winner with full scorecard
- **Multiple debate durations** — Flash (1 min), Pro (3 min), Ultra (5 min), Custom

## 🛠️ Tech Stack
- **Frontend:** React 19, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Node.js, Express
- **AI:** Google Gemini API
- **Deployment:** Render

## 🚀 Run Locally

```bash
# Clone the repo
git clone https://github.com/Neonderthal/AI_Debate_Simulator.git

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Add your GEMINI_API_KEY to .env

# Start the server
npm run dev
```

## 📁 Project Structure
├── server.ts          # Express backend & Gemini API calls
├── src/
│   ├── App.tsx        # Main application
│   ├── components/    # UI components
│   └── utils/         # Topic presets
## 🔑 Environment Variables
GEMINI_API_KEY=your_gemini_api_key
APP_URL=your_deployment_url
