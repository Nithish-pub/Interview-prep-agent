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

function dsaQuestionsForTopics(topics: Set<string>): InterviewQuestion[] {
  const questions: InterviewQuestion[] = [];

  if (topics.has("dynamic_programming")) {
    questions.push({
      id: "dp-1",
      competency: "dynamic_programming",
      isDsa: true,
      prompt: `Here's a DP problem: Given a 2D grid of non-negative integers, find the minimum cost path from the top-left to the bottom-right cell. You can only move right or down. Walk me through your state definition, recurrence relation, and how you'd optimise space from O(m×n) to O(n).`,
      details: {
        description: "Given an m×n grid of non-negative integers, find the path from top-left to bottom-right with the minimum total cost. You can only move right or down at each step.",
        examples: [
          {
            input: "grid = [[1,3,1],[1,5,1],[4,2,1]]",
            output: "7",
            explanation: "Path: 1 → 3 → 1 → 1 → 1. Total cost = 7."
          },
          {
            input: "grid = [[1,2,3],[4,5,6]]",
            output: "12",
            explanation: "Path: 1 → 2 → 3 → 6. Total cost = 12."
          }
        ],
        constraints: [
          "m == grid.length, n == grid[i].length",
          "1 ≤ m, n ≤ 200",
          "0 ≤ grid[i][j] ≤ 100"
        ],
        followUpHint: "Can you reduce the space to O(n) using a 1D DP array? What about O(1) by modifying the grid in place?"
      }
    });

    questions.push({
      id: "dp-2",
      competency: "dynamic_programming",
      isDsa: true,
      prompt: `Next DP problem: You're given an array of coin denominations and a target amount. Return the fewest coins needed to make up that amount, or -1 if it's not possible. Explain your bottom-up DP approach, state definition, and time complexity.`,
      details: {
        description: "You are given an integer array coins representing denominations and an integer amount. Return the fewest number of coins needed to make up amount. If it cannot be done, return -1. You may use each coin denomination an unlimited number of times.",
        examples: [
          {
            input: "coins = [1, 5, 11], amount = 15",
            output: "3",
            explanation: "15 = 11 + 3×1? No. 15 = 5 + 5 + 5 = 3 coins."
          },
          {
            input: "coins = [2], amount = 3",
            output: "-1",
            explanation: "Cannot make 3 with only 2-denomination coins."
          },
          {
            input: "coins = [1, 2, 5], amount = 11",
            output: "3",
            explanation: "11 = 5 + 5 + 1."
          }
        ],
        constraints: [
          "1 ≤ coins.length ≤ 12",
          "1 ≤ coins[i] ≤ 2^31 - 1",
          "0 ≤ amount ≤ 10^4"
        ],
        followUpHint: "Why does greedy fail here (e.g. coins = [1, 3, 4], amount = 6)? How does DP guarantee optimal substructure?"
      }
    });
  }

  if (topics.has("trees")) {
    questions.push({
      id: "tree-1",
      competency: "trees",
      isDsa: true,
      prompt: `Tree problem: Given the root of a binary tree, find the maximum path sum. The path can start and end at any node and does not need to pass through the root. Walk me through your recursive approach and how you handle subtrees with all negative values.`,
      details: {
        description: "A path in a binary tree is a sequence of nodes where each pair of adjacent nodes has an edge. The path does not need to pass through the root. The path sum is the sum of all node values on the path. Return the maximum path sum of any non-empty path.",
        examples: [
          {
            input: "root = [1, 2, 3]",
            output: "6",
            explanation: "Optimal path: 2 → 1 → 3, sum = 6."
          },
          {
            input: "root = [-10, 9, 20, null, null, 15, 7]",
            output: "42",
            explanation: "Optimal path: 15 → 20 → 7, sum = 42."
          },
          {
            input: "root = [-3]",
            output: "-3",
            explanation: "Only one node, must include it."
          }
        ],
        constraints: [
          "Number of nodes: [1, 3×10^4]",
          "-1000 ≤ Node.val ≤ 1000"
        ],
        followUpHint: "How does your helper function differ from what you return globally? Why do you take max(0, childGain) when computing the gain from each subtree?"
      }
    });

    questions.push({
      id: "tree-2",
      competency: "trees",
      isDsa: true,
      prompt: `Design an algorithm to serialize and deserialize a binary tree. Serialization converts the tree to a string, deserialization reconstructs it. Explain your traversal choice and how you mark null nodes.`,
      details: {
        description: "Implement serialize(root) and deserialize(data) for a binary tree. The serialized format must be unambiguous enough to reconstruct the exact tree. There is no restriction on the format you choose.",
        examples: [
          {
            input: "root = [1, 2, 3, null, null, 4, 5]",
            output: "\"1,2,null,null,3,4,null,null,5,null,null\"",
            explanation: "Pre-order traversal with null markers. Deserialization reconstructs the same tree."
          }
        ],
        constraints: [
          "Number of nodes: [0, 10^4]",
          "-1000 ≤ Node.val ≤ 1000",
          "The tree may not be a BST"
        ],
        followUpHint: "Why is pre-order easier to deserialize than in-order? What changes if the tree can have duplicate values?"
      }
    });
  }

  if (topics.has("graphs")) {
    questions.push({
      id: "graph-1",
      competency: "graphs",
      isDsa: true,
      prompt: `Graph problem: You have n courses and a list of prerequisite pairs. Return true if you can finish all courses, false if there's a cycle. Walk me through topological sort or DFS cycle detection — pick one and explain fully.`,
      details: {
        description: "There are numCourses courses (0 to numCourses-1). You are given an array prerequisites where prerequisites[i] = [a, b] means you must take course b before a. Return true if you can finish all courses (i.e., the graph has no directed cycle).",
        examples: [
          {
            input: "numCourses = 2, prerequisites = [[1,0]]",
            output: "true",
            explanation: "Take 0 first, then 1. No cycle."
          },
          {
            input: "numCourses = 2, prerequisites = [[1,0],[0,1]]",
            output: "false",
            explanation: "0 requires 1, and 1 requires 0. Cycle detected."
          }
        ],
        constraints: [
          "1 ≤ numCourses ≤ 2000",
          "0 ≤ prerequisites.length ≤ 5000",
          "prerequisites[i].length == 2",
          "No self-loops, no duplicate edges"
        ],
        followUpHint: "How would you return the actual course order instead of just true/false? Which algorithm gives you that directly?"
      }
    });
  }

  if (topics.has("greedy")) {
    questions.push({
      id: "greedy-1",
      competency: "greedy",
      isDsa: true,
      prompt: `Greedy problem: Given an array of intervals, merge all overlapping intervals and return the result. Explain why sorting first enables a greedy merge and prove that the approach is always optimal.`,
      details: {
        description: "Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals and return an array of the non-overlapping intervals that cover all the input intervals.",
        examples: [
          {
            input: "intervals = [[1,3],[2,6],[8,10],[15,18]]",
            output: "[[1,6],[8,10],[15,18]]",
            explanation: "[1,3] and [2,6] overlap → merge to [1,6]."
          },
          {
            input: "intervals = [[1,4],[4,5]]",
            output: "[[1,5]]",
            explanation: "[1,4] and [4,5] share endpoint 4 → merge to [1,5]."
          }
        ],
        constraints: [
          "1 ≤ intervals.length ≤ 10^4",
          "intervals[i].length == 2",
          "0 ≤ start_i ≤ end_i ≤ 10^4"
        ],
        followUpHint: "What is the time complexity and why? Could you do it without sorting? What if you need to find the minimum number of non-overlapping intervals to remove to make the rest non-overlapping?"
      }
    });
  }

  if (topics.has("sorting_searching")) {
    questions.push({
      id: "search-1",
      competency: "sorting_searching",
      isDsa: true,
      prompt: `Binary search variant: You have a sorted array that has been rotated at an unknown pivot. There are no duplicates. Find a target value in O(log n). Walk me through how you identify which half is sorted and how you decide which half to search.`,
      details: {
        description: "Given the integer array nums sorted in ascending order and rotated at an unknown pivot index, and an integer target, return the index of target if it is in nums, or -1 if it is not. You must write an algorithm with O(log n) runtime complexity.",
        examples: [
          {
            input: "nums = [4,5,6,7,0,1,2], target = 0",
            output: "4"
          },
          {
            input: "nums = [4,5,6,7,0,1,2], target = 3",
            output: "-1"
          },
          {
            input: "nums = [1], target = 0",
            output: "-1"
          }
        ],
        constraints: [
          "1 ≤ nums.length ≤ 5000",
          "-10^4 ≤ nums[i], target ≤ 10^4",
          "All values of nums are unique",
          "nums is sorted and rotated between 1 and n times"
        ],
        followUpHint: "What changes if the array can have duplicates? How does that affect worst-case complexity?"
      }
    });
  }

  if (topics.has("arrays_strings")) {
    questions.push({
      id: "array-1",
      competency: "arrays_strings",
      isDsa: true,
      prompt: `Sliding window problem: Find the length of the longest substring without repeating characters. Walk me through the sliding window — how you manage left and right pointers, and how you track seen characters.`,
      details: {
        description: "Given a string s, find the length of the longest substring without repeating characters.",
        examples: [
          {
            input: "s = \"abcabcbb\"",
            output: "3",
            explanation: "\"abc\" has length 3."
          },
          {
            input: "s = \"bbbbb\"",
            output: "1",
            explanation: "\"b\" has length 1."
          },
          {
            input: "s = \"pwwkew\"",
            output: "3",
            explanation: "\"wke\" has length 3."
          }
        ],
        constraints: [
          "0 ≤ s.length ≤ 5×10^4",
          "s consists of English letters, digits, symbols and spaces"
        ],
        followUpHint: "Can you do it in a single pass with O(1) space if the charset is only ASCII? What data structure gives you O(1) lookups?"
      }
    });
  }

  if (topics.has("recursion_backtracking")) {
    questions.push({
      id: "backtrack-1",
      competency: "recursion_backtracking",
      isDsa: true,
      prompt: `Backtracking problem: Generate all valid combinations of n pairs of parentheses. Explain the recursive structure, your pruning conditions — when you add an open vs close bracket — and the time complexity.`,
      details: {
        description: "Given n pairs of parentheses, write a function to generate all combinations of well-formed parentheses.",
        examples: [
          {
            input: "n = 3",
            output: "[\"((()))\", \"(()())\", \"(())()\", \"()(())\", \"()()()\"]"
          },
          {
            input: "n = 1",
            output: "[\"()\"]"
          }
        ],
        constraints: [
          "1 ≤ n ≤ 8"
        ],
        followUpHint: "What is the time complexity in terms of the Catalan number? How would you adapt this to generate all valid combinations of n types of brackets — (), [], {}?"
      }
    });
  }

  if (topics.has("heaps")) {
    questions.push({
      id: "heap-1",
      competency: "heaps",
      isDsa: true,
      prompt: `Heap design problem: Implement a data structure that supports two operations — adding a number from a stream, and finding the current median — with O(log n) add and O(1) findMedian. Walk me through the two-heap approach.`,
      details: {
        description: "The MedianFinder class must support: addNum(int num) — adds num from the data stream, and findMedian() — returns the median of all elements added so far. If the count is even, the median is the average of the two middle values.",
        examples: [
          {
            input: "addNum(1), addNum(2), findMedian(), addNum(3), findMedian()",
            output: "1.5, 2.0",
            explanation: "After [1,2] median = 1.5. After [1,2,3] median = 2.0."
          }
        ],
        constraints: [
          "-10^5 ≤ num ≤ 10^5",
          "At most 5×10^4 calls to addNum and findMedian",
          "findMedian is only called after at least one addNum"
        ],
        followUpHint: "If 99% of numbers are in [0, 100], how would you optimise? What if you need the median of a sliding window instead of the entire stream?"
      }
    });
  }

  if (topics.has("dsa_general") && questions.length === 0) {
    questions.push({
      id: "dsa-1",
      competency: "dsa_general",
      isDsa: true,
      prompt: `Here's a classic: Find the length of the longest consecutive integer sequence in an unsorted array in O(n) time. Explain how you use a hash set to avoid sorting and how you identify sequence start points.`,
      details: {
        description: "Given an unsorted array of integers nums, return the length of the longest consecutive elements sequence. You must write an algorithm that runs in O(n) time.",
        examples: [
          {
            input: "nums = [100, 4, 200, 1, 3, 2]",
            output: "4",
            explanation: "Longest sequence: [1, 2, 3, 4]."
          },
          {
            input: "nums = [0, 3, 7, 2, 5, 8, 4, 6, 0, 1]",
            output: "9",
            explanation: "Sequence [0..8] has length 9."
          }
        ],
        constraints: [
          "0 ≤ nums.length ≤ 10^5",
          "-10^9 ≤ nums[i] ≤ 10^9"
        ],
        followUpHint: "Why is checking num-1 not in the set the key to achieving O(n)? What happens without that check?"
      }
    });

    questions.push({
      id: "dsa-2",
      competency: "dsa_general",
      isDsa: true,
      prompt: `Design an LRU Cache that supports get and put in O(1) time. Walk me through the data structures you combine, how eviction works, and why a doubly linked list plus hash map is the right combination.`,
      details: {
        description: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache. Implement the LRUCache class: LRUCache(int capacity) initializes the LRU cache with capacity, int get(int key) returns the value if the key exists else -1, void put(int key, int value) updates or inserts the key. When the cache reaches capacity, evict the least recently used key before inserting the new one.",
        examples: [
          {
            input: "LRUCache(2); put(1,1); put(2,2); get(1); put(3,3); get(2); put(4,4); get(1); get(3); get(4)",
            output: "get(1)=1, get(2)=-1, get(1)=1, get(3)=3, get(4)=4",
            explanation: "Key 2 is evicted when 3 is inserted (LRU). Key 1 is evicted when 4 is inserted."
          }
        ],
        constraints: [
          "1 ≤ capacity ≤ 3000",
          "0 ≤ key ≤ 10^4",
          "0 ≤ value ≤ 10^5",
          "At most 2×10^5 calls to get and put"
        ],
        followUpHint: "What are the tradeoffs of using an OrderedDict in Python vs a manual doubly linked list? How would you extend this to an LFU (Least Frequently Used) cache?"
      }
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
    isDsa: false,
    prompt: questionForCompetency(competency, input)
  }));
}

export function buildInterviewPlan(input: InterviewInput): InterviewPlan {
  const focusTopics = parseFocusTopics(input.candidateFocus ?? "");
  let questions: InterviewQuestion[];

  if (isDsaFocused(focusTopics) && input.mode !== "behavioral") {
    questions = dsaQuestionsForTopics(focusTopics);

    if (input.mode === "mixed" && questions.length < 5) {
      const behavioralQ: InterviewQuestion = {
        id: "behavioral-1",
        competency: "behavioral_depth",
        isDsa: false,
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
