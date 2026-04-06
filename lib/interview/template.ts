import { InterviewInput, InterviewPlan } from "@/lib/interview/types";

function inferCompetencies(input: InterviewInput): string[] {
  const jd = input.jobDescription.toLowerCase();
  const competencies = new Set<string>();

  if (jd.includes("system design") || jd.includes("architecture")) {
    competencies.add("system_design");
  }
  if (jd.includes("stakeholder") || jd.includes("cross-functional")) {
    competencies.add("stakeholder_management");
  }
  if (jd.includes("ownership") || jd.includes("drive")) {
    competencies.add("ownership");
  }
  if (jd.includes("lead") || jd.includes("mentor")) {
    competencies.add("leadership");
  }
  if (jd.includes("algorithm") || jd.includes("coding")) {
    competencies.add("problem_solving");
  }

  if (input.mode !== "technical") {
    competencies.add("behavioral_depth");
  }
  if (input.mode !== "behavioral") {
    competencies.add("technical_depth");
  }

  return Array.from(competencies).slice(0, 5);
}

function buildQuestions(competencies: string[], input: InterviewInput) {
  return competencies.map((competency, index) => ({
    id: `${competency}-${index + 1}`,
    competency,
    prompt: questionForCompetency(competency, input)
  }));
}

function questionForCompetency(competency: string, input: InterviewInput): string {
  switch (competency) {
    case "system_design":
      return `Design a scalable feature relevant to a ${input.role} at ${input.company}. Walk me through tradeoffs, bottlenecks, and the first production risks you would de-risk.`;
    case "stakeholder_management":
      return "Tell me about a time you had to align conflicting stakeholders under pressure. What did you do, and what changed because of your actions?";
    case "ownership":
      return "Describe a project you drove end-to-end where the path was ambiguous. How did you create structure and keep momentum?";
    case "leadership":
      return "Tell me about a time you raised the bar for the team. What resistance did you face and how did you handle it?";
    case "problem_solving":
      return `You're handed a coding problem similar to what ${input.company} asks for ${input.role}. How do you frame the problem, choose an approach, and validate tradeoffs?`;
    case "technical_depth":
      return `Pick a technically hard project from your background that best matches this ${input.role} role. Explain the hardest decision you made and why.`;
    case "behavioral_depth":
    default:
      return `Tell me about an experience that best demonstrates why you are a fit for ${input.company}. Focus on what you did, not just what the team achieved.`;
  }
}

export function buildInterviewPlan(input: InterviewInput): InterviewPlan {
  const competencies = inferCompetencies(input);

  return {
    summary: `Interview plan for ${input.role} at ${input.company} covering ${competencies.join(", ")}.`,
    competencies,
    questions: buildQuestions(competencies, input)
  };
}
