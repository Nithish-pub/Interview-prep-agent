"use client";

import { useEffect, useRef, useState } from "react";

import type { InterviewMode } from "@/lib/interview/types";
import { connectOpenAIRealtimeVoice } from "@/lib/realtime-webrtc-client";

const INTERVIEW_MODES: InterviewMode[] = [
  "behavioral",
  "technical",
  "mixed"
];

interface StartResponse {
  interviewId: string;
  plan: {
    summary: string;
    competencies: string[];
    questions: Array<{ id: string; competency: string; prompt: string }>;
  };
  realtime: {
    clientSecret: string;
    expiresAt: string | null;
    model: string;
    voice: string;
  };
  firstQuestion: {
    prompt: string;
    competency: string;
  };
}

interface DecisionResponse {
  question: {
    id: string;
    competency: string;
    prompt: string;
  };
  decision: {
    action: string;
    prompt: string;
    evaluation: {
      answerQuality: string;
      signalsDetected: string[];
      missingSignals: string[];
      rationale: string;
    };
  };
}

const defaultJobDescription =
  "Senior software engineer role focused on backend systems, scalable APIs, cross-functional collaboration, system design, and ownership of critical product initiatives.";

export default function HomePage() {
  const [company, setCompany] = useState("Stripe");
  const [role, setRole] = useState("Senior Software Engineer");
  const [jobDescription, setJobDescription] = useState(defaultJobDescription);
  const [candidateFocus, setCandidateFocus] = useState(
    "I want harder follow-ups on ownership and system design."
  );
  const [mode, setMode] = useState<InterviewMode>("mixed");
  const [answer, setAnswer] = useState("");
  const [startData, setStartData] = useState<StartResponse | null>(null);
  const [decision, setDecision] = useState<DecisionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<
    "idle" | "connecting" | "connected" | "error"
  >("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voiceConnRef = useRef<{ disconnect: () => void } | null>(null);

  function disconnectVoice() {
    voiceConnRef.current?.disconnect();
    voiceConnRef.current = null;
    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
    setVoiceStatus("idle");
    setVoiceError(null);
  }

  useEffect(() => {
    return () => {
      voiceConnRef.current?.disconnect();
    };
  }, []);

  async function connectVoice() {
    if (!startData) {
      return;
    }
    setVoiceError(null);
    disconnectVoice();

    setVoiceStatus("connecting");
    try {
      const conn = await connectOpenAIRealtimeVoice({
        clientSecret: startData.realtime.clientSecret,
        onRemoteStream: (stream) => {
          const el = audioRef.current;
          if (el) {
            el.srcObject = stream;
            void el.play().catch(() => {
              setVoiceError(
                "Audio connected but playback was blocked. Click the page or check browser autoplay settings."
              );
            });
          }
        }
      });
      voiceConnRef.current = conn;
      setVoiceStatus("connected");
    } catch (err) {
      setVoiceStatus("error");
      setVoiceError(err instanceof Error ? err.message : String(err));
    }
  }

  async function startInterview() {
    setLoading(true);
    setDecision(null);

    try {
      const response = await fetch("/api/interviews/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          role,
          jobDescription,
          candidateFocus,
          mode
        })
      });

      const data = (await response.json()) as StartResponse;
      disconnectVoice();
      setStartData(data);
    } finally {
      setLoading(false);
    }
  }

  async function evaluateTurn() {
    if (!startData || !answer.trim()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/interviews/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId: startData.interviewId,
          answer
        })
      });

      const data = (await response.json()) as DecisionResponse;
      setDecision(data);
      setAnswer("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <section className="hero">
        <p className="muted">Realtime Interview Runtime Scaffold</p>
        <h1>Voice interviewer first, silent evaluator behind it.</h1>
        <p>
          This app creates an interview plan and mints a short-lived realtime
          session. Use <strong>Connect voice</strong> to open a WebRTC session to
          OpenAI so the model can speak and hear your microphone.
        </p>
      </section>

      <section className="grid">
        <div className="panel">
          <h2>Interview Setup</h2>

          <div className="field">
            <label htmlFor="company">Company</label>
            <input
              id="company"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="role">Role</label>
            <input
              id="role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="mode">Mode</label>
            <select
              id="mode"
              value={mode}
              onChange={(event) =>
                setMode(event.target.value as InterviewMode)
              }
            >
              {INTERVIEW_MODES.map((m) => (
                <option key={m} value={m}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="jobDescription">Job Description</label>
            <textarea
              id="jobDescription"
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="candidateFocus">Candidate Focus</label>
            <textarea
              id="candidateFocus"
              value={candidateFocus}
              onChange={(event) => setCandidateFocus(event.target.value)}
            />
          </div>

          <div className="buttonRow">
            <button className="button" onClick={startInterview} disabled={loading}>
              Start Session Scaffold
            </button>
          </div>
        </div>

        <div className="panel">
          <h2>Runtime Output</h2>
          {!startData ? (
            <p className="muted">
              Start an interview to see the generated plan and realtime session
              payload.
            </p>
          ) : (
            <div className="metricList">
              <div className="metric">
                <strong>Interview ID</strong>
                <span className="mono">{startData.interviewId}</span>
              </div>
              <div className="metric">
                <strong>Plan Summary</strong>
                <span>{startData.plan.summary}</span>
              </div>
              <div className="metric">
                <strong>First Question</strong>
                <span>{startData.firstQuestion.prompt}</span>
              </div>
              <div className="metric">
                <strong>Realtime Session</strong>
                <span className="mono">
                  model={startData.realtime.model} voice={startData.realtime.voice}
                </span>
              </div>
              <div className="metric">
                <strong>Voice (WebRTC)</strong>
                <p className="muted" style={{ margin: "8px 0 12px" }}>
                  Starting the scaffold only prepares the session. Connect here to
                  enable microphone input and speaker output.
                </p>
                <audio
                  ref={audioRef}
                  autoPlay
                  playsInline
                  className="srOnly"
                  aria-hidden
                />
                <div className="buttonRow" style={{ flexWrap: "wrap", gap: 8 }}>
                  {voiceStatus === "connected" ? (
                    <button
                      type="button"
                      className="button secondary"
                      onClick={disconnectVoice}
                    >
                      Disconnect voice
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="button"
                      onClick={connectVoice}
                      disabled={
                        loading ||
                        voiceStatus === "connecting" ||
                        startData.realtime.clientSecret ===
                          "missing-openai-api-key" ||
                        !startData.realtime.clientSecret?.trim()
                      }
                    >
                      {voiceStatus === "connecting"
                        ? "Connecting…"
                        : "Connect voice"}
                    </button>
                  )}
                  <span className="muted">
                    Status: {voiceStatus}
                    {startData.realtime.clientSecret ===
                    "missing-openai-api-key"
                      ? " · set OPENAI_API_KEY in .env.local"
                      : null}
                  </span>
                </div>
                {voiceError ? (
                  <p className="muted" style={{ color: "var(--warn, #c96)", marginTop: 8 }}>
                    {voiceError}
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="grid" style={{ marginTop: 20 }}>
        <div className="panel">
          <h3>Evaluate a Turn</h3>
          <div className="field">
            <label htmlFor="answer">Candidate Answer</label>
            <textarea
              id="answer"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Paste a transcript chunk or a mock answer here."
            />
          </div>

          <div className="buttonRow">
            <button
              className="button secondary"
              onClick={evaluateTurn}
              disabled={loading || !startData}
            >
              Evaluate and Pick Next Prompt
            </button>
          </div>
        </div>

        <div className="panel">
          <h3>Evaluator / Orchestrator</h3>
          {!decision ? (
            <p className="muted">
              Submit an answer to see the evaluator score it and decide on the
              next interviewer action.
            </p>
          ) : (
            <div className="eventList">
              <div className="event">
                <strong>Decision</strong>
                <span>{decision.decision.action}</span>
              </div>
              <div className="event">
                <strong>Next Prompt</strong>
                <span>{decision.decision.prompt}</span>
              </div>
              <div className="event">
                <strong>Answer Quality</strong>
                <span>{decision.decision.evaluation.answerQuality}</span>
              </div>
              <div className="event">
                <strong>Signals Detected</strong>
                <span>{decision.decision.evaluation.signalsDetected.join(", ") || "None"}</span>
              </div>
              <div className="event">
                <strong>Missing Signals</strong>
                <span>{decision.decision.evaluation.missingSignals.join(", ") || "None"}</span>
              </div>
              <div className="event">
                <strong>Rationale</strong>
                <span>{decision.decision.evaluation.rationale}</span>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
