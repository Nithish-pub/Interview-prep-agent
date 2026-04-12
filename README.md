# Prep Agent

An AI-powered mock interview platform that conducts live voice interviews tailored to your target company, role, and focus areas. It researches real interview patterns from the web, generates a dynamic question plan, and runs a voice session with an AI interviewer who evaluates your answers in real time.

---

## Features

- **Deep Research Phase** — Before generating the plan, searches Glassdoor, Blind, Reddit, and LeetCode Discuss for real questions asked at the target company. Shows found round structure and question patterns before the interview starts.
- **Dynamic Interview Plan** — GPT-4o generates a question plan grounded in real research data, tuned to your chosen difficulty and session length.
- **Difficulty + Time Controls** — Choose Easy / Medium / Hard and a session length (15, 30, 45, or 60 min). Question count is automatically derived from both.
- **Live Voice Interview** — WebRTC connects your browser directly to OpenAI's Realtime API. An AI interviewer named Alex asks questions, probes follow-ups, and wraps up.
- **Countdown Timer** — Visible in the interview header, turns red in the last 2 minutes.
- **LLM-as-Judge Evaluation** — Answers are evaluated by a LangChain LCEL chain (GPT-4o-mini, `withStructuredOutput`) for semantic quality, not regex heuristics. Generates contextual follow-up questions specific to what you said.
- **Code Editor** — DSA questions open a live code editor with hidden test cases, language selection, formatting, and simulated execution.
- **Design Canvas** — System design questions open a tldraw whiteboard for live diagramming.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| UI | React 18 + Tailwind CSS |
| Voice | OpenAI Realtime API over WebRTC |
| AI Planning | GPT-4o |
| AI Evaluation | GPT-4o-mini via LangChain LCEL |
| Web Research | Tavily JS SDK |
| Design Canvas | tldraw v4 |
| Schema Validation | Zod |

---

## API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/interviews/research` | POST | Tavily web search → GPT-4o synthesis → ResearchReport |
| `/api/interviews/start` | POST | Generate interview plan + create Realtime session |
| `/api/interviews/evaluate` | POST | LLM-as-judge evaluation + next turn decision |
| `/api/starter` | POST | Generate language-specific skeleton code |
| `/api/format` | POST | Format code via GPT-4o-mini |
| `/api/execute` | POST | Simulate code execution via GPT-4o-mini |

---

## Environment

Copy `.env.example` to `.env.local` and set:

```bash
OPENAI_API_KEY=your_key
OPENAI_REALTIME_MODEL=gpt-realtime

# Optional — enables the deep research phase (free tier: 1000 credits/month)
# Get your key at https://tavily.com
TAVILY_API_KEY=tvly-your_key
```

If `OPENAI_API_KEY` is not set, the app runs as a local scaffold with a placeholder realtime session.
If `TAVILY_API_KEY` is not set, the research phase is skipped and the plan is generated from your inputs alone.

---

## Run

```bash
npm install
npm run dev
```

---

## How it works

```
1. Fill in company, role, mode, difficulty, duration, and focus area
2. App researches real interview questions from the web (if Tavily key is set)
3. ResearchPanel shows found questions and round structure for 3 seconds
4. GPT-4o generates N questions tuned to difficulty and time
5. Connect voice — Alex introduces himself and begins asking questions
6. After each answer, LangChain evaluates quality and decides follow_up / move_on / wrap_up
7. DSA questions open the code editor; design questions open the whiteboard
```

---

## Next Steps

- Replace the in-memory interview store (`lib/interview/store.ts`) with Postgres or Supabase for session persistence
- Add user auth and interview history
- Replace simulated code execution with a real sandbox (e.g. Piston API)
- Replace the research pipeline with a full LangChain ReAct agent for adaptive multi-hop research
