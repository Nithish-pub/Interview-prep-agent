import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { DifficultyLevel, EvaluationResult, InterviewQuestion } from "@/lib/interview/types";

// ── LangChain LCEL chain (built once, reused per call) ──────────────────────

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

const evaluationSchema = z.object({
  answerQuality: z.enum(["low", "medium", "high"]).describe(
    "Overall quality of the candidate's answer"
  ),
  signalsDetected: z.array(z.string()).describe(
    "Positive signals present in the answer, e.g. 'quantified impact: 40% latency reduction', 'clear ownership using first-person', 'STAR structure followed'"
  ),
  missingSignals: z.array(z.string()).describe(
    "Key things absent from the answer, e.g. 'no outcome stated', 'uses we/team — no individual ownership', 'no concrete metrics'"
  ),
  followUpNeeded: z.boolean().describe(
    "True if the answer is weak or missing critical signals and a follow-up should be asked"
  ),
  suggestedFollowUp: z.string().nullable().describe(
    "A specific, contextual follow-up question targeting the biggest gap in this answer. Must reference what the candidate actually said. Null if followUpNeeded is false."
  ),
  rationale: z.string().describe(
    "1-2 sentences explaining the score, referencing specifics from the answer"
  ),
});

const structuredModel = model.withStructuredOutput(evaluationSchema);

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a strict, experienced technical interview evaluator.
Your job is to assess the quality of a candidate's answer to an interview question.

Evaluate along these dimensions:
- **Depth**: Does the answer go beyond surface-level? Does it show genuine understanding?
- **Specificity**: Are there concrete examples, numbers, names of tools/systems?
- **Ownership**: Does the candidate speak in first person and show personal contribution vs vague "we did"?
- **Outcome/Impact**: Is there a clear result? Was it measured?
- **Relevance**: Does the answer actually address the competency being tested?

Be demanding but fair. Match your bar to the difficulty level provided.
- easy: accept reasonable, clear answers without deep depth
- medium: require specifics and some evidence of impact
- hard: require depth, tradeoffs, concrete metrics, and real ownership

Never invent signals. Only report what is actually present or absent in the answer.`,
  ],
  [
    "user",
    `Competency: {competency}
Question Type: {questionType}
Difficulty: {difficulty}

Question:
{question}

Candidate's Answer:
{answer}`,
  ],
]);

const chain = prompt.pipe(structuredModel);

// ── Helper: derive question type from metadata ───────────────────────────────

function deriveQuestionType(question: InterviewQuestion): string {
  if (question.isDsa) return "coding / algorithm";
  if (question.competency.toLowerCase().includes("design")) return "system design";
  return "behavioral";
}

// ── Fallback for when the LLM call fails ─────────────────────────────────────

function safeFallback(question: InterviewQuestion): EvaluationResult {
  return {
    questionId: question.id,
    competency: question.competency,
    answerQuality: "medium",
    signalsDetected: [],
    missingSignals: [],
    followUpNeeded: false,
    followUpType: "move_on",
    suggestedFollowUp: null,
    rationale: "Evaluation unavailable — proceeding to next question.",
  };
}

// ── Public export ─────────────────────────────────────────────────────────────

export async function evaluateAnswer(
  question: InterviewQuestion,
  answer: string,
  difficulty: DifficultyLevel
): Promise<EvaluationResult> {
  try {
    const raw = await chain.invoke({
      competency: question.competency,
      questionType: deriveQuestionType(question),
      difficulty,
      question: question.prompt,
      answer,
    });

    return {
      questionId: question.id,
      competency: question.competency,
      answerQuality: raw.answerQuality,
      signalsDetected: raw.signalsDetected,
      missingSignals: raw.missingSignals,
      followUpNeeded: raw.followUpNeeded,
      followUpType: raw.followUpNeeded ? "follow_up" : "move_on",
      suggestedFollowUp: raw.suggestedFollowUp,
      rationale: raw.rationale,
    };
  } catch {
    return safeFallback(question);
  }
}
