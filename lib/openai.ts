import { RealtimeSessionPayload, InterviewInput, InterviewPlan, computeQuestionCount } from "@/lib/interview/types";

/** GA Realtime; must match WebRTC `/v1/realtime/calls` (not beta `/v1/realtime/sessions` secrets). */
const DEFAULT_REALTIME_MODEL =
  process.env.OPENAI_REALTIME_MODEL ?? "gpt-realtime";

interface CreateRealtimeSessionArgs {
  instructions: string;
  voice?: string;
}

export async function createRealtimeSession({
  instructions,
  voice = "alloy"
}: CreateRealtimeSessionArgs): Promise<RealtimeSessionPayload> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      clientSecret: "missing-openai-api-key",
      expiresAt: null,
      model: DEFAULT_REALTIME_MODEL,
      voice,
      instructions
    };
  }

  const response = await fetch(
    "https://api.openai.com/v1/realtime/client_secrets",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        expires_after: {
          anchor: "created_at",
          seconds: 600
        },
        session: {
          type: "realtime",
          model: DEFAULT_REALTIME_MODEL,
          instructions,
          audio: {
            output: { voice }
          }
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create realtime client secret: ${errorText}`);
  }

  const data = (await response.json()) as {
    value?: string;
    client_secret?: { value?: string; expires_at?: number };
    expires_at?: number;
    session?: {
      model?: string;
      audio?: { output?: { voice?: string } };
    };
  };

  const secret =
    data.value ?? data.client_secret?.value ?? "";
  const expiresAt =
    data.expires_at ?? data.client_secret?.expires_at ?? null;

  return {
    clientSecret: secret,
    expiresAt:
      expiresAt != null ? String(expiresAt) : null,
    model: data.session?.model ?? DEFAULT_REALTIME_MODEL,
    voice: data.session?.audio?.output?.voice ?? voice,
    instructions
  };
}

/**
 * Dynamically generates a tightly tailored set of interview questions via GPT-4o.
 */
export async function generateInterviewPlan(
  input: InterviewInput
): Promise<InterviewPlan> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Cannot generate interview plan: Missing OPENAI_API_KEY.");
  }

  const questionCount = computeQuestionCount(input.timeLimit, input.difficulty);

  const dsaContext = input.candidateFocus?.toLowerCase().includes("dsa") || input.candidateFocus?.toLowerCase().includes("algorith")
    ? "The user has explicitly requested DSA/Algorithms focus. You MUST output actual coding problems exactly as requested. E.g. 'Write a function to...'"
    : "";

  const difficultyGuide: Record<string, string> = {
    easy: "Questions must be clear, single-concept, and accessible to junior candidates. For DSA: easy LeetCode-style (array/string manipulation, basic recursion). For behavioral: simple STAR scenarios with a clear outcome. Avoid ambiguity.",
    medium: "Questions should require multi-step reasoning with some ambiguity. For DSA: medium LeetCode (trees, graphs, basic DP). For behavioral: leadership and cross-team challenges with tradeoffs. For system design: moderately scaled services.",
    hard: "Questions should be complex, open-ended, and challenge senior/staff-level candidates. For DSA: hard LeetCode (advanced DP, complex graphs, bit manipulation). For behavioral: strategic decisions, large-scale incidents, long-term architecture choices. For system design: globally distributed, high-throughput systems.",
  };

  const researchSection = input.researchContext
    ? `\n\nREAL-WORLD RESEARCH FINDINGS — use these to ground your questions in actual interview patterns:\n\nRound structure: ${input.researchContext.companyRoundStructure}\n\nReal questions previously reported by candidates:\n${input.researchContext.realQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n\nTop topics by frequency: ${Object.entries(input.researchContext.topicFrequency).sort(([, a], [, b]) => b - a).slice(0, 8).map(([t, c]) => `${t} (${c}×)`).join(", ")}\n\nUse these real patterns to make your 5 questions highly targeted and realistic for this company and role.`
    : "";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert technical interviewer at ${input.company}. Your goal is to map the user's focus areas into a rigorous ${questionCount}-question interview plan for a ${input.timeLimit}-minute session. Do not ask for their code, just provide the prompt for them to answer.\n\nDifficulty level: ${input.difficulty.toUpperCase()} — ${difficultyGuide[input.difficulty]} ${dsaContext}${researchSection}`
        },
        {
          role: "user",
          content: `Company: ${input.company}\nRole: ${input.role}\nMode: ${input.mode}\nDifficulty: ${input.difficulty}\nSession Length: ${input.timeLimit} minutes\nNumber of questions to generate: ${questionCount}\nJob Description: ${input.jobDescription}\nCandidate Focus Area: ${input.candidateFocus || 'None given'}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "interview_plan_schema",
          schema: {
            type: "object",
            properties: {
              summary: {
                type: "string",
                description: "A short 1-sentence summary of the interview focus."
              },
              competencies: {
                type: "array",
                items: { type: "string" },
                description: "A list of unique competencies covered (e.g. 'system_design', 'dynamic_programming')."
              },
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", description: "A unique short id e.g. q1" },
                    competency: { type: "string", description: "The competency for this specific question" },
                    prompt: { type: "string", description: "The intensely detailed interview question text." },
                    isDsa: { type: "boolean", description: "Whether this is a pure algorithm/technical question requiring the code editor." },
                    constraints: { type: "array", items: { type: "string" }, description: "Specific constraints (e.g. time/space complexity) if this is a DSA question, otherwise empty." },
                    testCases: { type: "array", items: { type: "string" }, description: "Examples or test cases if this is a DSA question, otherwise empty." }
                  },
                  required: ["id", "competency", "prompt", "isDsa", "constraints", "testCases"],
                  additionalProperties: false
                }
              }
            },
            required: ["summary", "competencies", "questions"],
            additionalProperties: false
          },
          strict: true
        }
      }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI Completion Failed: ${text}`);
  }

  const jsonResponse = await response.json();
  const rawContent = jsonResponse.choices[0].message.content;
  return JSON.parse(rawContent) as InterviewPlan;
}

/**
 * Super-fast GPT-4o-mini execution proxy acting as a language-agnostic code compiler
 */
export async function simulateCodeExecution(
  language: string,
  code: string,
  version: string
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY.");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini", // Blazing fast for simple logical tracing
      messages: [
        {
          role: "system",
          content: `You are a strict, deterministic, and highly accurate headless code compiler/execution runtime for ${language} v${version}. You must trace and execute the following source code to the absolute best of your ability. Return the EXACT standard output and standard error that a physical machine would emit when compiling and running this code, and the exit code. If there are syntax errors, output realistic compilation/runtime error traces to stderr. ONLY output the JSON structure.`
        },
        {
          role: "user",
          content: `Code to execute:\n\n${code}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "compiler_output",
          schema: {
            type: "object",
            properties: {
              stdout: { type: "string" },
              stderr: { type: "string" },
              exitCode: { type: "number" }
            },
            required: ["stdout", "stderr", "exitCode"],
            additionalProperties: false
          },
          strict: true
        }
      }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI Execution Failed: ${await response.text()}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content) as { stdout: string; stderr: string; exitCode: number };
}
