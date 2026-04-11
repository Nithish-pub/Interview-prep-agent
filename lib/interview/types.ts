export type InterviewMode = "behavioral" | "technical" | "mixed";

export type DifficultyLevel = "easy" | "medium" | "hard";

/** Valid session lengths in minutes */
export type TimeLimit = 15 | 30 | 45 | 60;

/** Returns how many questions fit in the given time at the given difficulty.
 *  Avg minutes per question (incl. follow-ups): easy=9, medium=13, hard=25 */
export function computeQuestionCount(
  timeLimit: TimeLimit,
  difficulty: DifficultyLevel
): number {
  const avg: Record<DifficultyLevel, number> = { easy: 9, medium: 13, hard: 25 };
  return Math.max(1, Math.min(8, Math.floor(timeLimit / avg[difficulty])));
}

export type CompetencyScore = "low" | "medium" | "high";

export type NextAction = "follow_up" | "move_on" | "clarify" | "wrap_up";

export interface InterviewInput {
  company: string;
  role: string;
  jobDescription: string;
  candidateFocus?: string;
  mode: InterviewMode;
  difficulty: DifficultyLevel;
  timeLimit: TimeLimit;
  researchContext?: ResearchReport;
}

export interface ResearchReport {
  companyRoundStructure: string;
  realQuestions: string[];
  topicFrequency: Record<string, number>;
  sources: string[];
}

export interface ResearchInput {
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
  constraints?: string[];
  testCases?: string[];
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

export interface StarterResponse {
  prefix: string;
  editable: string;
  suffix: string;
}

export interface StartResponse {
  interviewId: string;
  plan: InterviewPlan;
  realtime: Omit<RealtimeSessionPayload, "instructions">;
  firstQuestion: InterviewQuestion;
}
