import {
  CompetencyState,
  EvaluationResult,
  InterviewPlan,
  InterviewSessionState,
  TurnDecision
} from "@/lib/interview/types";

function createCompetencyState(evaluation: EvaluationResult): CompetencyState {
  return {
    score: evaluation.answerQuality,
    evidence: evaluation.signalsDetected,
    missingSignals: evaluation.missingSignals,
    followUpCount: evaluation.followUpNeeded ? 1 : 0
  };
}

export function createInitialSessionState(
  interviewId: string
): InterviewSessionState {
  return {
    interviewId,
    currentQuestionIndex: 0,
    coveredCompetencies: {},
    askedQuestionIds: []
  };
}

export function decideNextTurn(
  plan: InterviewPlan,
  state: InterviewSessionState,
  evaluation: EvaluationResult
): TurnDecision {
  const nextState: InterviewSessionState = {
    ...state,
    coveredCompetencies: {
      ...state.coveredCompetencies,
      [evaluation.competency]: createCompetencyState(evaluation)
    },
    askedQuestionIds: state.askedQuestionIds.includes(evaluation.questionId)
      ? state.askedQuestionIds
      : [...state.askedQuestionIds, evaluation.questionId]
  };

  if (evaluation.followUpNeeded) {
    return {
      action: "follow_up",
      prompt: evaluation.suggestedFollowUp ?? "Can you go one level deeper there?",
      updatedState: nextState,
      evaluation
    };
  }

  const nextIndex = state.currentQuestionIndex + 1;
  const nextQuestion = plan.questions[nextIndex];

  if (!nextQuestion) {
    return {
      action: "wrap_up",
      prompt:
        "That covers the planned interview loop. Wrap by summarizing the candidate's strongest signal and one area to sharpen before the real interview.",
      updatedState: {
        ...nextState,
        currentQuestionIndex: nextIndex
      },
      evaluation
    };
  }

  return {
    action: "move_on",
    prompt: nextQuestion.prompt,
    updatedState: {
      ...nextState,
      currentQuestionIndex: nextIndex
    },
    evaluation
  };
}
