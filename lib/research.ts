import { tavily } from "@tavily/core";
import { ResearchInput, ResearchReport } from "@/lib/interview/types";

const SEARCH_TIMEOUT_MS = 15_000;
const MAX_CONTENT_PER_RESULT = 1_500;

// --- Stage 1: GPT-4o generates targeted search queries ---

async function generateSearchQueries(
  input: ResearchInput,
  apiKey: string
): Promise<string[]> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a research assistant generating search queries to find real interview questions and round structure from community sources (Glassdoor, Blind, LeetCode Discuss, Reddit). Output exactly 4 diverse queries targeting different source types.",
        },
        {
          role: "user",
          content: `Company: ${input.company}\nRole: ${input.role}\nFocus: ${input.candidateFocus || "general"}\nMode: ${input.mode}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "search_queries",
          schema: {
            type: "object",
            properties: {
              queries: {
                type: "array",
                items: { type: "string" },
                description: "4 targeted search queries",
              },
            },
            required: ["queries"],
            additionalProperties: false,
          },
          strict: true,
        },
      },
    }),
  });

  if (!response.ok) throw new Error("Query generation failed");
  const data = await response.json();
  const { queries } = JSON.parse(data.choices[0].message.content) as {
    queries: string[];
  };
  return queries.slice(0, 4);
}

// --- Stage 2: Parallel Tavily searches ---

interface TavilyResult {
  url: string;
  title: string;
  content: string;
}

async function executeParallelSearches(
  queries: string[],
  tavilyKey: string
): Promise<TavilyResult[]> {
  const client = tavily({ apiKey: tavilyKey });

  const searches = queries.map((q) =>
    client.search(q, {
      searchDepth: "advanced",
      maxResults: 4,
      includeAnswer: false,
    })
  );

  const results = await Promise.all(searches);

  const flat: TavilyResult[] = [];
  for (const res of results) {
    for (const r of res.results ?? []) {
      flat.push({
        url: r.url,
        title: r.title ?? "",
        content: (r.content ?? "").slice(0, MAX_CONTENT_PER_RESULT),
      });
    }
  }
  return flat;
}

// --- Stage 3: GPT-4o synthesizes findings into ResearchReport ---

async function synthesizeFindings(
  results: TavilyResult[],
  input: ResearchInput,
  apiKey: string
): Promise<ResearchReport> {
  const combinedContent = results
    .map((r) => `[Source: ${r.url}]\n${r.title}\n${r.content}`)
    .join("\n\n---\n\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at extracting structured interview intelligence from community reports.
Given scraped content from Glassdoor, Blind, Reddit, and LeetCode Discuss, extract:
1. The round structure for ${input.company} ${input.role} interviews (how many rounds, what type each round is)
2. Actual verbatim or near-verbatim questions that candidates reported being asked
3. Topic frequency — how often each topic appears across the sources
4. The source URLs that were useful

Be specific and concrete. Only extract questions and structure that appear in the source content.`,
        },
        {
          role: "user",
          content: `Company: ${input.company}\nRole: ${input.role}\n\nSearch results:\n\n${combinedContent}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "research_report",
          schema: {
            type: "object",
            properties: {
              companyRoundStructure: {
                type: "string",
                description:
                  "Description of the interview round structure, e.g. '5 rounds: phone screen, 2 coding rounds, system design, bar raiser'",
              },
              realQuestions: {
                type: "array",
                items: { type: "string" },
                description: "Actual questions reported by candidates",
              },
              topicFrequency: {
                type: "object",
                additionalProperties: { type: "number" },
                description:
                  "Map of topic to frequency count, e.g. {\"dynamic programming\": 8}",
              },
              sources: {
                type: "array",
                items: { type: "string" },
                description: "URLs of the sources used",
              },
            },
            required: [
              "companyRoundStructure",
              "realQuestions",
              "topicFrequency",
              "sources",
            ],
            additionalProperties: false,
          },
          strict: true,
        },
      },
    }),
  });

  if (!response.ok) throw new Error("Synthesis failed");
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content) as ResearchReport;
}

// --- Public export ---

export async function runDeepResearch(
  input: ResearchInput
): Promise<ResearchReport | null> {
  const tavilyKey = process.env.TAVILY_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!tavilyKey || !openaiKey) return null;

  const researchPromise = (async () => {
    const queries = await generateSearchQueries(input, openaiKey);
    const results = await executeParallelSearches(queries, tavilyKey);
    if (results.length === 0) return null;
    return await synthesizeFindings(results, input, openaiKey);
  })();

  const timeoutPromise = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), SEARCH_TIMEOUT_MS)
  );

  try {
    return await Promise.race([researchPromise, timeoutPromise]);
  } catch {
    return null;
  }
}
