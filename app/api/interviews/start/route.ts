import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createInitialSessionState } from "@/lib/interview/orchestrator";
import { saveInterview } from "@/lib/interview/store";
import { buildInterviewPlan } from "@/lib/interview/template";
import { InterviewInput, InterviewQuestion } from "@/lib/interview/types";
import { createRealtimeSession } from "@/lib/openai";

const startSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  jobDescription: z.string().min(10),
  candidateFocus: z.string().optional(),
  mode: z.enum(["behavioral", "technical", "mixed"])
});

function buildInstructions(input: InterviewInput, questions: InterviewQuestion[]) {
  const questionList = questions
    .map((q, i) => `Q${i + 1} [${q.competency}]: ${q.prompt}`)
    .join("\n");

  const focusLine = input.candidateFocus
    ? `\nCandidate focus area: ${input.candidateFocus}. Tailor your follow-ups and probing to this area.`
    : "";

  return [
    `You are a professional technical interviewer conducting a mock interview for the ${input.role} role at ${input.company}.`,
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
  const plan = buildInterviewPlan(payload);
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
