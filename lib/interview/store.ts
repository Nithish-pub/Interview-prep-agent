import {
  InterviewInput,
  InterviewPlan,
  InterviewSessionState
} from "@/lib/interview/types";

interface StoredInterview {
  input: InterviewInput;
  plan: InterviewPlan;
  state: InterviewSessionState;
}

const interviews = new Map<string, StoredInterview>();

export function saveInterview(
  interviewId: string,
  payload: StoredInterview
) {
  interviews.set(interviewId, payload);
}

export function getInterview(interviewId: string) {
  return interviews.get(interviewId);
}

export function updateInterviewState(
  interviewId: string,
  state: InterviewSessionState
) {
  const interview = interviews.get(interviewId);

  if (!interview) {
    return null;
  }

  interview.state = state;
  interviews.set(interviewId, interview);
  return interview;
}
