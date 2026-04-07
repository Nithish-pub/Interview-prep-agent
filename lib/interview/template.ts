import { InterviewInput, InterviewPlan, InterviewQuestion } from "@/lib/interview/types";

function inferCompetencies(input: InterviewInput): string[] {
  const jd = input.jobDescription.toLowerCase();
  const focus = (input.candidateFocus ?? "").toLowerCase();
  const combined = jd + " " + focus;
  const competencies = new Set<string>();

  if (combined.match(/system\s*design|architecture|scalab|distributed|microservice/)) {
    competencies.add("system_design");
  }
  if (combined.match(/stakeholder|cross.functional|partner|align|influenc/)) {
    competencies.add("stakeholder_management");
  }
  if (combined.match(/ownership|drive|end.to.end|deliver|product\s*sense/)) {
    competencies.add("ownership");
  }
  if (combined.match(/lead|mentor|manag|team|grow|coach/)) {
    competencies.add("leadership");
  }
  if (combined.match(/debug|troubleshoot|incident|reliability|oncall|sre|infra/)) {
    competencies.add("debugging");
  }
  if (combined.match(/perform|latency|throughput|optimis|scale|capacity/)) {
    competencies.add("performance");
  }
  if (combined.match(/api|backend|service|restful|grpc|microservice/)) {
    competencies.add("backend_design");
  }
  if (combined.match(/data|pipeline|database|sql|nosql|schema|query/)) {
    competencies.add("data_modeling");
  }

  if (input.mode !== "technical") competencies.add("behavioral_depth");
  if (input.mode !== "behavioral") competencies.add("technical_depth");

  return Array.from(competencies).slice(0, 5);
}

function questionForCompetency(competency: string, input: InterviewInput): InterviewQuestion {
  const id = `${competency}-1`;
  const base = { id, competency, isDsa: false as const };

  switch (competency) {
    case "system_design":
      return {
        ...base,
        prompt: `Design a core system or service you would be responsible for as a ${input.role} at ${input.company}. Pick a real scenario from your experience or propose one relevant to the role. Walk me through the architecture: key components, data flow, how you'd handle scale, and the first failure modes you'd design against.`
      };
    case "stakeholder_management":
      return {
        ...base,
        prompt: `Tell me about a time you had to align stakeholders who had conflicting priorities or disagreed on the path forward. What was at stake, how did you navigate it, and what was the outcome?`
      };
    case "ownership":
      return {
        ...base,
        prompt: `Describe a project you owned end-to-end where the requirements were ambiguous or changed significantly mid-way. How did you create structure, keep momentum, and ensure delivery? What would you do differently?`
      };
    case "leadership":
      return {
        ...base,
        prompt: `Tell me about a time you raised the bar for your team — technically, culturally, or in terms of process. What resistance did you face and how did you handle it?`
      };
    case "debugging":
      return {
        ...base,
        prompt: `Walk me through a production incident or hard debugging session you led or played a key role in. How did you diagnose it, what was the root cause, and what did you put in place to prevent recurrence?`
      };
    case "performance":
      return {
        ...base,
        prompt: `Describe a time you significantly improved the performance or reliability of a system. What metrics guided you, what was the bottleneck, and how did you validate the improvement in production?`
      };
    case "backend_design":
      return {
        ...base,
        prompt: `Design a well-structured API or service layer for a feature that would be core to the ${input.role} role at ${input.company}. Walk me through the interface contract, error handling strategy, and how you'd version it for future changes.`
      };
    case "data_modeling":
      return {
        ...base,
        prompt: `Design the data model for a key feature in a product you've worked on or one relevant to ${input.company}. Walk me through your entity relationships, indexing strategy, and how your design handles growth and queries at scale.`
      };
    case "technical_depth":
      return {
        ...base,
        prompt: `Pick the most technically complex project from your background that best demonstrates your fit for this ${input.role} role. Walk me through the hardest technical decision you made, the tradeoffs you weighed, and the outcome.`
      };
    case "behavioral_depth":
    default:
      return {
        ...base,
        prompt: `Tell me about an experience that best demonstrates why you're a strong fit for the ${input.role} role at ${input.company}. Focus on your specific contribution — not the team's — and what you learned from it.`
      };
  }
}

function buildFallbackQuestions(input: InterviewInput): InterviewQuestion[] {
  const competencies = inferCompetencies(input);

  if (competencies.length < 4) {
    const extras = ["technical_depth", "behavioral_depth", "ownership", "system_design"];
    for (const e of extras) {
      if (!competencies.includes(e)) competencies.push(e);
      if (competencies.length >= 5) break;
    }
  }

  return competencies
    .slice(0, 5)
    .map((competency) => questionForCompetency(competency, input));
}

export function buildInterviewPlan(input: InterviewInput): InterviewPlan {
  const questions = buildFallbackQuestions(input);
  const competencies = [...new Set(questions.map((q) => q.competency))];

  return {
    summary: `Interview plan for ${input.role} at ${input.company} covering: ${competencies.join(", ")}.`,
    competencies,
    questions
  };
}
