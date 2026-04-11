"use client";

import { useEffect, useRef, useState } from "react";
import type { InterviewMode, DifficultyLevel, TimeLimit, StartResponse, ResearchReport } from "@/lib/interview/types";
import {
  connectOpenAIRealtimeVoice,
  type RealtimeEvent,
} from "@/lib/realtime-webrtc-client";

const defaultJobDescription =
  "Senior software engineer role focused on backend systems, scalable APIs, cross-functional collaboration, system design, and ownership of critical product initiatives.";

export function useInterviewSession() {
  const [view, setView] = useState<"setup" | "interview">("setup");
  const [darkMode, setDarkMode] = useState(true);
  const [company, setCompany] = useState("Amazon");
  const [role, setRole] = useState("Software Dev Engineer");
  const [jobDescription, setJobDescription] = useState(defaultJobDescription);
  const [candidateFocus, setCandidateFocus] = useState(
    "Focus on system design, backend API design, and ownership of critical initiatives."
  );
  const [mode, setMode] = useState<InterviewMode>("technical");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("medium");
  const [timeLimit, setTimeLimit] = useState<TimeLimit>(30);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [startData, setStartData] = useState<StartResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<"idle" | "researching" | "generating">("idle");
  const [researchReport, setResearchReport] = useState<ResearchReport | null>(null);
  const [showResearchPanel, setShowResearchPanel] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
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
    if (audioRef.current) audioRef.current.srcObject = null;
    setVoiceStatus("idle");
    setVoiceError(null);
    setAiTranscript("");
    setUserSpeaking(false);
    transcriptRef.current = "";
  }

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
  }, [darkMode]);

  useEffect(() => {
    return () => {
      voiceConnRef.current?.disconnect();
    };
  }, []);

  // Countdown timer — starts when interview view becomes active
  useEffect(() => {
    if (view !== "interview" || timeRemaining === null) return;
    if (timeRemaining <= 0) return;

    const id = setInterval(() => {
      setTimeRemaining((t) => (t !== null && t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [view, timeRemaining]);

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
              setVoiceError(
                "Audio connected but playback was blocked. Check browser autoplay settings."
              );
            });
          }
        },
        onEvent: handleRealtimeEvent,
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
    setLoadingPhase("researching");
    setStartData(null);
    setStartError(null);
    setResearchReport(null);
    setShowResearchPanel(false);
    disconnectVoice();
    setCurrentQIndex(0);

    try {
      // Phase 1: Deep Research (fails silently — never blocks the interview)
      let report: ResearchReport | null = null;
      try {
        const researchRes = await fetch("/api/interviews/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company, role, jobDescription, candidateFocus, mode, difficulty, timeLimit }),
        });
        if (researchRes.ok) {
          const { report: r } = await researchRes.json() as { report: ResearchReport | null };
          report = r ?? null;
        }
      } catch {
        // Research unavailable — continue without it
      }

      if (report) {
        setResearchReport(report);
        setShowResearchPanel(true);
        await new Promise<void>((resolve) => setTimeout(resolve, 3000));
      }

      // Phase 2: Generate Plan
      setLoadingPhase("generating");
      const response = await fetch("/api/interviews/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company, role, jobDescription, candidateFocus, mode,
          difficulty, timeLimit,
          researchContext: report ?? undefined,
        }),
      });
      if (!response.ok) {
        throw new Error(`Server error ${response.status}`);
      }
      const data = (await response.json()) as StartResponse;
      setStartData(data);
      setShowResearchPanel(false);
      setTimeRemaining(timeLimit * 60); // start countdown in seconds
      setView("interview");
    } catch (err) {
      setStartError(
        err instanceof Error ? err.message : "Failed to generate plan."
      );
    } finally {
      setLoading(false);
      setLoadingPhase("idle");
    }
  }

  function endInterview() {
    disconnectVoice();
    setStartData(null);
    setCurrentQIndex(0);
    setTimeRemaining(null);
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

  function toggleDarkMode() {
    setDarkMode((d) => !d);
  }

  return {
    darkMode, toggleDarkMode,
    company, setCompany,
    role, setRole,
    jobDescription, setJobDescription,
    candidateFocus, setCandidateFocus,
    mode, setMode,
    difficulty, setDifficulty,
    timeLimit, setTimeLimit,
    timeRemaining,
    view,
    startData,
    loading,
    loadingPhase,
    researchReport,
    showResearchPanel,
    startError,
    currentQIndex,
    voiceStatus,
    voiceError,
    aiTranscript,
    userSpeaking,
    missingKey,
    audioRef,
    startInterview,
    endInterview,
    nextQuestion,
    prevQuestion,
    connectVoice,
    disconnectVoice,
  };
}
