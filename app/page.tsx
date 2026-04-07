"use client";

import { useEffect, useRef, useState } from "react";

import type { InterviewMode } from "@/lib/interview/types";
import {
  connectOpenAIRealtimeVoice,
  RealtimeEvent
} from "@/lib/realtime-webrtc-client";
import DesignCanvas from "@/app/components/DesignCanvas";
import CodeWorkspace from "@/app/components/CodeWorkspace";

const INTERVIEW_MODES: InterviewMode[] = ["behavioral", "technical", "mixed"];

interface Question {
  id: string;
  competency: string;
  prompt: string;
}

interface StartResponse {
  interviewId: string;
  plan: {
    summary: string;
    competencies: string[];
    questions: Question[];
  };
  realtime: {
    clientSecret: string;
    expiresAt: string | null;
    model: string;
    voice: string;
  };
  firstQuestion: Question;
}

const defaultJobDescription =
  "Senior software engineer role focused on backend systems, scalable APIs, cross-functional collaboration, system design, and ownership of critical product initiatives.";

export default function HomePage() {
  const [view, setView] = useState<"setup" | "interview">("setup");
  const [darkMode, setDarkMode] = useState(false);
  const [company, setCompany] = useState("Amazon");
  const [role, setRole] = useState("Software Dev Engineer");
  const [jobDescription, setJobDescription] = useState(defaultJobDescription);
  const [candidateFocus, setCandidateFocus] = useState(
    "Focus on system design, backend API design, and ownership of critical initiatives."
  );
  const [mode, setMode] = useState<InterviewMode>("technical");
  const [startData, setStartData] = useState<StartResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [aiTranscript, setAiTranscript] = useState("");
  const [userSpeaking, setUserSpeaking] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voiceConnRef = useRef<{ disconnect: () => void } | null>(null);
  const transcriptRef = useRef("");

  function disconnectVoice() {
    voiceConnRef.current?.disconnect();
    voiceConnRef.current = null;
    if (audioRef.current) audioRef.current.srcObject = null;
    setVoiceStatus("idle");
    setVoiceError(null);
    setAiTranscript("");
    setUserSpeaking(false);
    transcriptRef.current = "";
  }

  useEffect(() => {
    return () => { voiceConnRef.current?.disconnect(); };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  function handleRealtimeEvent(event: RealtimeEvent) {
    switch (event.type) {
      case "response.audio_transcript.delta": {
        const delta = event.delta as string | undefined;
        if (delta) {
          transcriptRef.current += delta;
          setAiTranscript(transcriptRef.current);
        }
        break;
      }
      case "response.audio_transcript.done": {
        const transcript = event.transcript as string | undefined;
        if (transcript) {
          transcriptRef.current = transcript;
          setAiTranscript(transcript);
        }
        break;
      }
      case "response.done": {
        transcriptRef.current = "";
        break;
      }
      case "input_audio_buffer.speech_started": {
        setUserSpeaking(true);
        break;
      }
      case "input_audio_buffer.speech_stopped": {
        setUserSpeaking(false);
        break;
      }
    }
  }

  async function connectVoice() {
    if (!startData) return;
    setVoiceError(null);
    disconnectVoice();
    setVoiceStatus("connecting");
    transcriptRef.current = "";

    try {
      const conn = await connectOpenAIRealtimeVoice({
        clientSecret: startData.realtime.clientSecret,
        onRemoteStream: (stream) => {
          const el = audioRef.current;
          if (el) {
            el.srcObject = stream;
            void el.play().catch(() => {
              setVoiceError("Audio connected but playback was blocked. Check browser autoplay settings.");
            });
          }
        },
        onEvent: handleRealtimeEvent
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
    setStartData(null);
    disconnectVoice();
    setCurrentQIndex(0);

    try {
      const response = await fetch("/api/interviews/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, role, jobDescription, candidateFocus, mode })
      });
      const data = (await response.json()) as StartResponse;
      setStartData(data);
      setView("interview");
    } finally {
      setLoading(false);
    }
  }

  function endInterview() {
    disconnectVoice();
    setStartData(null);
    setCurrentQIndex(0);
    setView("setup");
  }

  function nextQuestion() {
    if (!startData) return;
    if (currentQIndex < startData.plan.questions.length - 1) {
      setCurrentQIndex((i) => i + 1);
    }
  }

  function prevQuestion() {
    if (currentQIndex > 0) {
      setCurrentQIndex((i) => i - 1);
    }
  }

  const missingKey =
    startData?.realtime.clientSecret === "missing-openai-api-key" ||
    !startData?.realtime.clientSecret?.trim();

  if (view === "interview" && startData) {
    const questions = startData.plan.questions;
    const currentQ = questions[currentQIndex];
    const total = questions.length;

    return (
      <div className="callScreen">
        <audio ref={audioRef} autoPlay playsInline className="srOnly" aria-hidden />

        <header className="callHeader">
          <div className="callHeaderLeft">
            <span className="callLogo">Prep Agent</span>
            <span className="callMeta">{company} · {role}</span>
          </div>
          <div className="callHeaderRight">
            <div className="progressDots">
              {questions.map((_, i) => (
                <span
                  key={i}
                  className={`dot ${i === currentQIndex ? "active" : i < currentQIndex ? "done" : ""}`}
                />
              ))}
            </div>
            <button className="themeToggle" onClick={() => setDarkMode((d) => !d)} title="Toggle dark mode">
              {darkMode ? "☀" : "☾"}
            </button>
            <button className="button secondary endBtn" onClick={endInterview}>
              End Interview
            </button>
          </div>
        </header>

        <main className="callMain">
          <div className="callLeft">
          <div className="questionCard">
            <div className="questionCardHeader">
              <span className="qBadge">Question {currentQIndex + 1} of {total}</span>
              <span className="qTag">{currentQ.competency.replace(/_/g, " ")}</span>
            </div>

            <p className="qPromptText">{currentQ.prompt}</p>

            <div className="qNav">
              <button
                className="button secondary"
                onClick={prevQuestion}
                disabled={currentQIndex === 0}
              >
                ← Previous
              </button>
              <button
                className="button"
                onClick={nextQuestion}
                disabled={currentQIndex === total - 1}
              >
                Next Question →
              </button>
            </div>
          </div>

          {["system_design", "backend_design", "data_modeling"].includes(currentQ.competency) ? (
            <DesignCanvas key={currentQ.id} />
          ) : ["technical_depth", "debugging", "performance"].includes(currentQ.competency) ? (
            <CodeWorkspace key={currentQ.id} />
          ) : null}
        </div>

        <div className="voicePanel">
            {voiceStatus === "connected" && (
              <div className="transcriptBox">
                <span className="transcriptLabel">
                  {userSpeaking ? "🎙 You are speaking…" : "Alex (AI Interviewer)"}
                </span>
                <p className="transcriptText">{aiTranscript || "Listening…"}</p>
              </div>
            )}

            <div className="voiceControls">
              {voiceStatus === "connected" ? (
                <button type="button" className="button secondary" onClick={disconnectVoice}>
                  Disconnect Voice
                </button>
              ) : (
                <button
                  type="button"
                  className="button micBtn"
                  onClick={connectVoice}
                  disabled={loading || voiceStatus === "connecting" || missingKey}
                >
                  {voiceStatus === "connecting" ? "Connecting…" : "🎙 Join Voice"}
                </button>
              )}

              <span className="voiceStatusBadge" data-status={voiceStatus}>
                {voiceStatus === "connected"
                  ? "● Live"
                  : voiceStatus === "connecting"
                  ? "● Connecting"
                  : voiceStatus === "error"
                  ? "● Error"
                  : "○ Ready to connect"}
              </span>

              {missingKey && (
                <span className="muted" style={{ fontSize: 13 }}>
                  Set OPENAI_API_KEY in .env.local to enable voice.
                </span>
              )}
            </div>

            {voiceError && <p className="voiceError">{voiceError}</p>}
          </div>
        </main>
      </div>
    );
  }

  return (
    <main className="page">
      <section className="hero">
        <div className="heroTop">
          <p className="muted">AI Mock Interviewer</p>
          <button className="themeToggle" onClick={() => setDarkMode((d) => !d)} title="Toggle dark mode">
            {darkMode ? "☀" : "☾"}
          </button>
        </div>
        <h1>Prep Agent</h1>
        <p>
          Fill in your details and focus area, then generate a tailored interview
          plan to start a live voice session.
        </p>
      </section>

      <section className="grid">
        <div className="panel">
          <h2>Interview Setup</h2>

          <div className="field">
            <label htmlFor="company">Company</label>
            <input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="role">Role</label>
            <input id="role" value={role} onChange={(e) => setRole(e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="mode">Mode</label>
            <select id="mode" value={mode} onChange={(e) => setMode(e.target.value as InterviewMode)}>
              {INTERVIEW_MODES.map((m) => (
                <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="jobDescription">Job Description</label>
            <textarea
              id="jobDescription"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="candidateFocus">Candidate Focus</label>
            <textarea
              id="candidateFocus"
              value={candidateFocus}
              onChange={(e) => setCandidateFocus(e.target.value)}
              placeholder="e.g. Focus on system design, API design, ownership, and leadership. Push harder on tradeoffs."
            />
          </div>

          <div className="buttonRow">
            <button className="button" onClick={startInterview} disabled={loading}>
              {loading ? "Generating plan…" : "Generate Interview Plan →"}
            </button>
          </div>
        </div>

        <div className="panel setupInfo">
          <h2>How it works</h2>
          <ol className="howList">
            <li>
              <strong>Set your focus</strong>
              <span>Tell us the company, role, and what areas you want to be tested on — system design, behavioral, technical depth, or a mix.</span>
            </li>
            <li>
              <strong>Generate a plan</strong>
              <span>We build a set of targeted, role-specific questions. System design questions come with a live canvas; technical questions come with a code editor.</span>
            </li>
            <li>
              <strong>Enter the interview</strong>
              <span>One question at a time. Join voice to talk with Alex, your AI interviewer. Alex probes, follows up, and moves on when you're ready.</span>
            </li>
          </ol>
        </div>
      </section>
    </main>
  );
}
