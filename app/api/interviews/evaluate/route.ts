import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { evaluateAnswer } from "@/lib/interview/evaluator";
import { decideNextTurn } from "@/lib/interview/orchestrator";
import { getInterview, updateInterviewState } from "@/lib/interview/store";

const evaluateSchema = z.object({
  interviewId: z.string().uuid(),
  answer: z.string().min(1)
});

export async function POST(request: NextRequest) {
  const payload = evaluateSchema.parse(await request.json());
  const interview = getInterview(payload.interviewId);

  if (!interview) {
    return NextResponse.json(
      { error: "Interview session not found." },
      { status: 404 }
    );
  }

  const question = interview.plan.questions[interview.state.currentQuestionIndex];

  if (!question) {
    return NextResponse.json(
      { error: "Interview session has no active question." },
      { status: 400 }
    );
  }

  const evaluation = evaluateAnswer(question, payload.answer);
  const decision = decideNextTurn(interview.plan, interview.state, evaluation);

  updateInterviewState(payload.interviewId, decision.updatedState);

  return NextResponse.json({
    question,
    decision
  });
}
