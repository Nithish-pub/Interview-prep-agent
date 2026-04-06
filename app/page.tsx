"use client";

import { useEffect, useRef, useState } from "react";

import type { InterviewMode } from "@/lib/interview/types";
import {
  connectOpenAIRealtimeVoice,
  RealtimeEvent
} from "@/lib/realtime-webrtc-client";

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
  firstQuestion: {
    prompt: string;
    competency: string;
  };
}

const defaultJobDescription =
  "Senior software engineer role focused on backend systems, scalable APIs, cross-functional collaboration, system design, and ownership of critical product initiatives.";

export default function HomePage() {
  const [company, setCompany] = useState("Stripe");
  const [role, setRole] = useState("Senior Software Engineer");
  const [jobDescription, setJobDescription] = useState(defaultJobDescription);
  const [candidateFocus, setCandidateFocus] = useState(
    "I want to focus on DSA, dynamic programming, trees and greedy approach."
  );
  const [mode, setMode] = useState<InterviewMode>("technical");
  const [startData, setStartData] = useState<StartResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<
    "idle" | "connecting" | "connected" | "error"
  >("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [aiTranscript, setAiTranscript] = useState("");
  const [userSpeaking, setUserSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voiceConnRef = useRef<{ disconnect: () => void } | null>(null);
  const transcriptRef = useRef("");

  function disconnectVoice() {
    voiceConnRef.current?.disconnect();
    voiceConnRef.current = null;
    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
    setVoiceStatus("idle");
    setVoiceError(null);
    setAiTranscript("");
    setUserSpeaking(false);
    transcriptRef.current = "";
  }

  useEffect(() => {
    return () => {
      voiceConnRef.current?.disconnect();
    };
  }, []);

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
      default:
        break;
    }
  }

  async function connectVoice() {
    if (!startData) return;
    setVoiceError(null);
    disconnectVoice();
    setVoiceStatus("connecting");
    setAiTranscript("");
    transcriptRef.current = "";

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

    try {
      const response = await fetch("/api/interviews/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, role, jobDescription, candidateFocus, mode })
      });

      const data = (await response.json()) as StartResponse;
      setStartData(data);
    } finally {
      setLoading(false);
    }
  }

  const missingKey =
    startData?.realtime.clientSecret === "missing-openai-api-key" ||
    !startData?.realtime.clientSecret?.trim();

  return (
    <main className="page">
      <section className="hero">
        <p className="muted">AI Mock Interviewer</p>
        <h1>Prep Agent</h1>
        <p>
          Set up your interview, generate a question plan tailored to your focus
          area, then connect your voice to start the session.
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
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="role">Role</label>
            <input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="mode">Mode</label>
            <select
              id="mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as InterviewMode)}
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
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="candidateFocus">Candidate Focus</label>
            <textarea
              id="candidateFocus"
              value={candidateFocus}
              onChange={(e) => setCandidateFocus(e.target.value)}
              placeholder="e.g. Focus on DSA, dynamic programming, trees and greedy. Harder follow-ups on edge cases."
            />
          </div>

          <div className="buttonRow">
            <button className="button" onClick={startInterview} disabled={loading}>
              {loading ? "Generating plan…" : "Generate Interview Plan"}
            </button>
          </div>
        </div>

        <div className="panel">
          <h2>Voice Session</h2>

          {!startData ? (
            <p className="muted">
              Generate an interview plan to unlock the voice session.
            </p>
          ) : (
            <>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Questions ({startData.plan.questions.length})</label>
                <div className="questionList">
                  {startData.plan.questions.map((q, i) => (
                    <div key={q.id} className="questionItem">
                      <span className="questionNumber">Q{i + 1}</span>
                      <div>
                        <span className="questionTag">{q.competency.replace(/_/g, " ")}</span>
                        <p className="questionPrompt">{q.prompt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <audio ref={audioRef} autoPlay playsInline className="srOnly" aria-hidden />

              <div className="voiceBlock">
                {voiceStatus === "connected" && (
                  <div className="transcriptBox">
                    <span className="transcriptLabel">
                      {userSpeaking ? "🎙 You are speaking…" : "AI Interviewer"}
                    </span>
                    <p className="transcriptText">
                      {aiTranscript || "Listening…"}
                    </p>
                  </div>
                )}

                <div className="voiceControls">
                  {voiceStatus === "connected" ? (
                    <button
                      type="button"
                      className="button secondary"
                      onClick={disconnectVoice}
                    >
                      End Session
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="button"
                      onClick={connectVoice}
                      disabled={
                        loading ||
                        voiceStatus === "connecting" ||
                        missingKey
                      }
                    >
                      {voiceStatus === "connecting" ? "Connecting…" : "Start Voice Interview"}
                    </button>
                  )}

                  <span className="voiceStatusBadge" data-status={voiceStatus}>
                    {voiceStatus === "connected"
                      ? "● Live"
                      : voiceStatus === "connecting"
                      ? "● Connecting"
                      : voiceStatus === "error"
                      ? "● Error"
                      : "○ Ready"}
                  </span>

                  {missingKey && (
                    <span className="muted" style={{ fontSize: 13 }}>
                      Set OPENAI_API_KEY in .env.local to enable voice.
                    </span>
                  )}
                </div>

                {voiceError && (
                  <p className="voiceError">{voiceError}</p>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
