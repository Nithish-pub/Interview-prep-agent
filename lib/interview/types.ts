export type InterviewMode = "behavioral" | "technical" | "mixed";

export type CompetencyScore = "low" | "medium" | "high";

export type NextAction = "follow_up" | "move_on" | "clarify" | "wrap_up";

export interface InterviewInput {
  company: string;
  role: string;
  jobDescription: string;
  candidateFocus?: string;
  mode: InterviewMode;
}

export interface DsaExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface QuestionDetails {
  description: string;
  examples: DsaExample[];
  constraints: string[];
  followUpHint?: string;
}

export interface InterviewQuestion {
  id: string;
  competency: string;
  prompt: string;
  isDsa?: boolean;
  details?: QuestionDetails;
}

export interface InterviewPlan {
  summary: string;
  competencies: string[];
  questions: InterviewQuestion[];
}

export interface InterviewSessionState {
  interviewId: string;
  currentQuestionIndex: number;
  coveredCompetencies: Record<string, CompetencyState>;
  askedQuestionIds: string[];
}

export interface CompetencyState {
  score: CompetencyScore;
  evidence: string[];
  missingSignals: string[];
  followUpCount: number;
}

export interface RealtimeSessionPayload {
  clientSecret: string;
  expiresAt: string | null;
  model: string;
  voice: string;
  instructions: string;
}

export interface EvaluationResult {
  questionId: string;
  competency: string;
  answerQuality: CompetencyScore;
  signalsDetected: string[];
  missingSignals: string[];
  followUpNeeded: boolean;
  followUpType: Exclude<NextAction, "move_on" | "wrap_up"> | "move_on";
  suggestedFollowUp: string | null;
  rationale: string;
}

export interface TurnDecision {
  action: NextAction;
  prompt: string;
  updatedState: InterviewSessionState;
  evaluation: EvaluationResult;
}
