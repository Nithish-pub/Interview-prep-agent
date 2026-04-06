import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createInitialSessionState } from "@/lib/interview/orchestrator";
import { saveInterview } from "@/lib/interview/store";
import { buildInterviewPlan } from "@/lib/interview/template";
import { InterviewInput } from "@/lib/interview/types";
import { createRealtimeSession } from "@/lib/openai";

const startSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  jobDescription: z.string().min(40),
  candidateFocus: z.string().optional(),
  mode: z.enum(["behavioral", "technical", "mixed"])
});

function buildInstructions(input: InterviewInput, firstQuestion: string) {
  return [
    `You are a realistic interviewer for ${input.company}.`,
    `The target role is ${input.role}.`,
    "Run a professional mock interview with one question at a time.",
    "Do not teach immediately. Evaluate the answer and only probe when the answer is weak or vague.",
    "Keep the conversation concise, realistic, and slightly demanding.",
    `Open with this first question: ${firstQuestion}`
  ].join(" ");
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

  const instructions = buildInstructions(payload, firstQuestion.prompt);
  const realtime = await createRealtimeSession({ instructions });

  return NextResponse.json({
    interviewId,
    plan,
    state,
    realtime,
    firstQuestion
  });
}
