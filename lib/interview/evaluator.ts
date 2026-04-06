import {
  EvaluationResult,
  InterviewQuestion
} from "@/lib/interview/types";

const fillerPatterns = [
  "kind of",
  "sort of",
  "maybe",
  "i think",
  "basically"
];

const metricPattern = /\b\d+[%xkmb]?\b/i;

function detectSignals(answer: string) {
  const lower = answer.toLowerCase();
  const signals: string[] = [];
  const missing: string[] = [];

  if (answer.length > 180) {
    signals.push("sufficient_detail");
  } else {
    missing.push("detail");
  }

  if (metricPattern.test(answer)) {
    signals.push("uses_metrics");
  } else {
    missing.push("metrics");
  }

  if (/\b(i|my|me)\b/i.test(answer)) {
    signals.push("ownership_language");
  } else {
    missing.push("ownership");
  }

  if (/\b(result|outcome|impact|improved|reduced|increased)\b/i.test(lower)) {
    signals.push("outcome_clarity");
  } else {
    missing.push("outcome");
  }

  if (fillerPatterns.some((pattern) => lower.includes(pattern))) {
    missing.push("precision");
  }

  return { signals, missing };
}

function scoreAnswer(answer: string, missingSignals: string[]) {
  if (answer.length < 80 || missingSignals.length >= 3) {
    return "low" as const;
  }

  if (answer.length > 240 && missingSignals.length <= 1) {
    return "high" as const;
  }

  return "medium" as const;
}

function buildFollowUp(question: InterviewQuestion, missingSignals: string[]) {
  if (missingSignals.includes("metrics")) {
    return "Quantify the outcome. What changed in measurable terms because of your work?";
  }

  if (missingSignals.includes("ownership")) {
    return "Be specific about your part. What exactly did you decide or execute yourself?";
  }

  if (missingSignals.includes("outcome")) {
    return `Close the loop on ${question.competency}. What was the end result, and how did you know your approach worked?`;
  }

  if (missingSignals.includes("detail")) {
    return `Go one level deeper on ${question.competency}. What was the hardest moment and how did you handle it?`;
  }

  return null;
}

export function evaluateAnswer(
  question: InterviewQuestion,
  answer: string
): EvaluationResult {
  const { signals, missing } = detectSignals(answer);
  const answerQuality = scoreAnswer(answer, missing);
  const suggestedFollowUp = buildFollowUp(question, missing);

  return {
    questionId: question.id,
    competency: question.competency,
    answerQuality,
    signalsDetected: signals,
    missingSignals: missing,
    followUpNeeded: answerQuality !== "high" && suggestedFollowUp !== null,
    followUpType: suggestedFollowUp ? "follow_up" : "move_on",
    suggestedFollowUp,
    rationale:
      answerQuality === "high"
        ? "The response included concrete ownership and enough signal to move forward."
        : "The response is missing at least one signal needed for a strong interview answer."
  };
}
