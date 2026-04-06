import { InterviewInput, InterviewPlan, InterviewQuestion } from "@/lib/interview/types";

function parseFocusTopics(candidateFocus: string): Set<string> {
  const lower = candidateFocus.toLowerCase();
  const topics = new Set<string>();

  if (/dynamic\s*programming|dp\b/.test(lower)) topics.add("dynamic_programming");
  if (/\btree(s)?\b|binary\s*tree|bst/.test(lower)) topics.add("trees");
  if (/\bgraph(s)?\b|bfs|dfs/.test(lower)) topics.add("graphs");
  if (/\bgreedy\b/.test(lower)) topics.add("greedy");
  if (/\bsorting\b|\bsearch(ing)?\b|binary\s*search/.test(lower)) topics.add("sorting_searching");
  if (/\barray(s)?\b|\bstring(s)?\b|\bsliding\s*window\b|\btwo\s*pointer(s)?\b/.test(lower)) topics.add("arrays_strings");
  if (/\brecursion\b|\bbacktrack(ing)?\b/.test(lower)) topics.add("recursion_backtracking");
  if (/\bheap(s)?\b|\bpriority\s*queue\b/.test(lower)) topics.add("heaps");
  if (/\blinked\s*list(s)?\b/.test(lower)) topics.add("linked_lists");
  if (/\bdsa\b|data\s*struct|algorithm/.test(lower)) topics.add("dsa_general");
  if (/system\s*design|architecture|scalab/.test(lower)) topics.add("system_design");
  if (/\bownership\b|\bdrive\b|\bend.to.end\b/.test(lower)) topics.add("ownership");
  if (/\blead\b|\bmentor\b|\bmanag/.test(lower)) topics.add("leadership");

  return topics;
}

function isDsaFocused(topics: Set<string>): boolean {
  const dsaTopics = [
    "dynamic_programming", "trees", "graphs", "greedy",
    "sorting_searching", "arrays_strings", "recursion_backtracking",
    "heaps", "linked_lists", "dsa_general"
  ];
  return dsaTopics.some((t) => topics.has(t));
}

function dsaQuestionsForTopics(topics: Set<string>, input: InterviewInput): InterviewQuestion[] {
  const questions: InterviewQuestion[] = [];

  if (topics.has("dynamic_programming")) {
    questions.push({
      id: "dp-1",
      competency: "dynamic_programming",
      prompt: `Given a 2D grid, find the minimum cost path from top-left to bottom-right where you can move right or down. Walk me through your DP formulation — state definition, recurrence, and how you'd optimise space.`
    });
    questions.push({
      id: "dp-2",
      competency: "dynamic_programming",
      prompt: `You are given coins of different denominations and a target amount. Find the fewest coins that make up the amount, or return -1 if not possible. Explain how bottom-up DP applies here and what the time complexity is.`
    });
  }

  if (topics.has("trees")) {
    questions.push({
      id: "tree-1",
      competency: "trees",
      prompt: `Given the root of a binary tree, find the maximum path sum where the path can start and end at any node. Walk me through your recursive approach and how you handle negative values.`
    });
    questions.push({
      id: "tree-2",
      competency: "trees",
      prompt: `Serialize and deserialize a binary tree. Explain your choice of traversal and how you handle null nodes in the serialized string.`
    });
  }

  if (topics.has("graphs")) {
    questions.push({
      id: "graph-1",
      competency: "graphs",
      prompt: `You are given a list of courses and their prerequisites. Detect if it is possible to finish all courses. Walk me through your approach using topological sort or DFS cycle detection.`
    });
  }

  if (topics.has("greedy")) {
    questions.push({
      id: "greedy-1",
      competency: "greedy",
      prompt: `Given an array of intervals, merge all overlapping ones and return the result. Explain why a greedy approach works here and prove its correctness.`
    });
  }

  if (topics.has("sorting_searching")) {
    questions.push({
      id: "search-1",
      competency: "sorting_searching",
      prompt: `You have a sorted rotated array without duplicates. Find a target value in O(log n). Walk me through how you identify which half is sorted and narrow the search space.`
    });
  }

  if (topics.has("arrays_strings")) {
    questions.push({
      id: "array-1",
      competency: "arrays_strings",
      prompt: `Find the longest substring without repeating characters. Walk me through the sliding window approach — how you manage the window bounds and the character set.`
    });
  }

  if (topics.has("recursion_backtracking")) {
    questions.push({
      id: "backtrack-1",
      competency: "recursion_backtracking",
      prompt: `Generate all valid combinations of parentheses for n pairs. Explain your backtracking decision tree and how you prune invalid states early.`
    });
  }

  if (topics.has("heaps")) {
    questions.push({
      id: "heap-1",
      competency: "heaps",
      prompt: `Design a data structure that supports adding numbers and finding the median in O(log n) per insert and O(1) per query. Walk me through the two-heap approach.`
    });
  }

  if (topics.has("dsa_general") && questions.length === 0) {
    questions.push({
      id: "dsa-1",
      competency: "dsa_general",
      prompt: `Given an unsorted array, find the length of the longest consecutive sequence in O(n) time. Explain how you use a hash set to avoid sorting.`
    });
    questions.push({
      id: "dsa-2",
      competency: "dsa_general",
      prompt: `Implement LRU Cache with O(1) get and O(1) put. Walk me through the data structures you combine and how eviction works.`
    });
  }

  return questions.slice(0, 5);
}

function inferCompetencies(input: InterviewInput): string[] {
  const jd = input.jobDescription.toLowerCase();
  const focus = (input.candidateFocus ?? "").toLowerCase();
  const combined = jd + " " + focus;
  const competencies = new Set<string>();

  if (combined.includes("system design") || combined.includes("architecture")) {
    competencies.add("system_design");
  }
  if (combined.includes("stakeholder") || combined.includes("cross-functional")) {
    competencies.add("stakeholder_management");
  }
  if (combined.includes("ownership") || combined.includes("drive")) {
    competencies.add("ownership");
  }
  if (combined.includes("lead") || combined.includes("mentor")) {
    competencies.add("leadership");
  }
  if (combined.includes("algorithm") || combined.includes("coding")) {
    competencies.add("problem_solving");
  }

  if (input.mode !== "technical") competencies.add("behavioral_depth");
  if (input.mode !== "behavioral") competencies.add("technical_depth");

  return Array.from(competencies).slice(0, 5);
}

function questionForCompetency(competency: string, input: InterviewInput): string {
  switch (competency) {
    case "system_design":
      return `Design a scalable feature relevant to a ${input.role} at ${input.company}. Walk me through tradeoffs, bottlenecks, and the first production risks you'd de-risk.`;
    case "stakeholder_management":
      return "Tell me about a time you aligned conflicting stakeholders under pressure. What did you do and what changed?";
    case "ownership":
      return "Describe a project you drove end-to-end where the path was ambiguous. How did you create structure and keep momentum?";
    case "leadership":
      return "Tell me about a time you raised the bar for the team. What resistance did you face and how did you handle it?";
    case "problem_solving":
      return `Walk me through a hard coding problem you solved at work. How did you frame it, choose your approach, and validate the tradeoffs?`;
    case "technical_depth":
      return `Pick a technically hard project from your background that best matches this ${input.role} role. Explain the hardest technical decision you made and why.`;
    case "behavioral_depth":
    default:
      return `Tell me about an experience that best demonstrates why you are a fit for ${input.company}. Focus on your specific contribution, not the team's.`;
  }
}

function buildFallbackQuestions(input: InterviewInput): InterviewQuestion[] {
  const competencies = inferCompetencies(input);
  return competencies.map((competency, index) => ({
    id: `${competency}-${index + 1}`,
    competency,
    prompt: questionForCompetency(competency, input)
  }));
}

export function buildInterviewPlan(input: InterviewInput): InterviewPlan {
  const focusTopics = parseFocusTopics(input.candidateFocus ?? "");
  let questions: InterviewQuestion[];

  if (isDsaFocused(focusTopics) && input.mode !== "behavioral") {
    questions = dsaQuestionsForTopics(focusTopics, input);

    if (input.mode === "mixed" && questions.length < 5) {
      const behavioralQ: InterviewQuestion = {
        id: "behavioral-1",
        competency: "behavioral_depth",
        prompt: `Tell me about a time you had to debug a particularly tricky problem under pressure. What was your process and what did you learn?`
      };
      questions = [...questions, behavioralQ].slice(0, 5);
    }
  } else {
    questions = buildFallbackQuestions(input);
  }

  const competencies = [...new Set(questions.map((q) => q.competency))];

  return {
    summary: `Interview plan for ${input.role} at ${input.company} covering: ${competencies.join(", ")}.`,
    competencies,
    questions
  };
}
