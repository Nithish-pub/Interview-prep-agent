import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createInitialSessionState } from "@/lib/interview/orchestrator";
import { saveInterview } from "@/lib/interview/store";
import { InterviewInput, InterviewQuestion } from "@/lib/interview/types";
import { createRealtimeSession, generateInterviewPlan } from "@/lib/openai";

const startSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  jobDescription: z.string().min(10),
  candidateFocus: z.string().optional(),
  mode: z.enum(["behavioral", "technical", "mixed"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  timeLimit: z.union([z.literal(15), z.literal(30), z.literal(45), z.literal(60)]),
  researchContext: z.object({
    companyRoundStructure: z.string(),
    realQuestions: z.array(z.string()),
    topicFrequency: z.record(z.number()),
    sources: z.array(z.string()),
  }).optional(),
});

function buildInstructions(input: InterviewInput, questions: InterviewQuestion[]) {
  const questionList = questions
    .map((q, i) => `Q${i + 1} [${q.competency}]: ${q.prompt}`)
    .join("\n");

  const focusLine = input.candidateFocus
    ? `\nCandidate focus area: ${input.candidateFocus}. Tailor your follow-ups and probing to this area.`
    : "";

  const difficultyTone: Record<string, string> = {
    easy: "Keep the bar accessible — accept reasonable answers and move briskly. Do not over-probe.",
    medium: "Hold a solid bar. Probe for specifics and tradeoffs. One focused follow-up if the answer is shallow.",
    hard: "Hold a high bar. Challenge vague answers, push for depth, edge cases, and concrete tradeoffs. Be demanding but professional.",
  };

  return [
    `You are a professional technical interviewer conducting a mock interview for the ${input.role} role at ${input.company}.`,
    ``,
    `Session details: ${input.timeLimit} minutes total, difficulty: ${input.difficulty.toUpperCase()}. There are ${questions.length} questions. Pace yourself — you have roughly ${Math.floor(input.timeLimit / questions.length)} minutes per question.`,
    ``,
    `Start by briefly introducing yourself in one or two sentences — your name is Alex, you are an AI interviewer — then immediately ask Question 1 below. Do not ask for permission, just begin.`,
    ``,
    `Rules:`,
    `- Ask one question at a time in the order listed.`,
    `- After the candidate answers, evaluate whether the answer is strong or weak.`,
    `- If the answer is weak, vague, or missing key signals (no specifics, no metrics, no clear ownership, or no outcome), ask one focused follow-up before moving to the next question.`,
    `- If the answer is strong, briefly acknowledge and move directly to the next question.`,
    `- Keep the tone professional, concise, and slightly demanding — like a real interview.`,
    `- Do not teach or explain concepts. Stay in interviewer mode.`,
    `- Maximum one follow-up per question, then move on regardless.`,
    `- Difficulty standard: ${difficultyTone[input.difficulty]}`,
    `- When all questions are done, briefly thank the candidate and end the session.`,
    focusLine,
    ``,
    `Questions to cover:`,
    questionList
  ]
    .filter((line) => line !== null)
    .join("\n");
}

export async function POST(request: NextRequest) {
  const payload = startSchema.parse(await request.json());
  const interviewId = crypto.randomUUID();
  
  // Call our new dynamic LLM generator logic instead of the static regex templates.
  const plan = await generateInterviewPlan(payload);
  
  const state = createInitialSessionState(interviewId);
  const firstQuestion = plan.questions[0];

  saveInterview(interviewId, {
    input: payload,
    plan,
    state
  });

  const instructions = buildInstructions(payload, plan.questions);
  const realtime = await createRealtimeSession({ instructions });

  return NextResponse.json({
    interviewId,
    plan,
    state,
    realtime,
    firstQuestion
  });
}
