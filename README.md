# Prep Agent

Initial MVP scaffold for a realtime interview-prep app.

## What is included

- Next.js app router setup
- `POST /api/interviews/start` to build an interview plan and create a realtime session payload
- `POST /api/interviews/evaluate` to evaluate a candidate answer and decide whether to follow up or move on
- A minimal UI to exercise the flow

## Environment

Copy `.env.example` to `.env.local` and set:

```bash
OPENAI_API_KEY=your_key
OPENAI_REALTIME_MODEL=gpt-realtime
```

If `OPENAI_API_KEY` is not set, the app still works as a local scaffold and returns a placeholder realtime session payload.

## Run

```bash
npm install
npm run dev
```

## Next steps

1. Replace the in-memory interview store with Postgres or Supabase.
2. Connect the browser to the returned realtime session via WebRTC.
3. Stream transcript events to the evaluator endpoint instead of pasting answers manually.
4. Add scheduled interviews and background jobs.
