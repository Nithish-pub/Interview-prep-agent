"use client";

import { useInterviewSession } from "@/app/hooks/useInterviewSession";
import SetupView from "@/app/components/SetupView";
import InterviewView from "@/app/components/InterviewView";

export default function HomePage() {
  const session = useInterviewSession();

  if (session.view === "interview" && session.startData) {
    return (
      <InterviewView
        company={session.company}
        questions={session.startData.plan.questions}
        currentQIndex={session.currentQIndex}
        voiceStatus={session.voiceStatus}
        voiceError={session.voiceError}
        aiTranscript={session.aiTranscript}
        userSpeaking={session.userSpeaking}
        missingKey={session.missingKey}
        loading={session.loading}
        darkMode={session.darkMode}
        timeRemaining={session.timeRemaining}
        audioRef={session.audioRef}
        onEnd={session.endInterview}
        onNext={session.nextQuestion}
        onPrev={session.prevQuestion}
        onConnect={session.connectVoice}
        onDisconnect={session.disconnectVoice}
        onToggleDarkMode={session.toggleDarkMode}
      />
    );
  }

  return (
    <SetupView
      company={session.company}
      setCompany={session.setCompany}
      role={session.role}
      setRole={session.setRole}
      jobDescription={session.jobDescription}
      setJobDescription={session.setJobDescription}
      candidateFocus={session.candidateFocus}
      setCandidateFocus={session.setCandidateFocus}
      mode={session.mode}
      setMode={session.setMode}
      difficulty={session.difficulty}
      setDifficulty={session.setDifficulty}
      timeLimit={session.timeLimit}
      setTimeLimit={session.setTimeLimit}
      loading={session.loading}
      loadingPhase={session.loadingPhase}
      researchReport={session.researchReport}
      showResearchPanel={session.showResearchPanel}
      startError={session.startError}
      darkMode={session.darkMode}
      onToggleDarkMode={session.toggleDarkMode}
      onStart={session.startInterview}
    />
  );
}
