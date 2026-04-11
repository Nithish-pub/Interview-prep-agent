import { NextRequest, NextResponse } from "next/server";
import type { StarterResponse } from "@/lib/interview/types";

const TEST_RUNNER_RULES = `
The suffix must be a test runner that:
1. Runs every visible example test case AND generates 2-3 hidden edge cases on your own.
2. For each test prints EXACTLY one of these two lines (no other format):
   [PASS] Test N
   [FAIL] Test N: expected <value> got <value>
   Label hidden edge cases as "Test N (hidden)".
3. After all tests prints exactly this separator: ---
4. Then prints exactly: N/M tests passed   (e.g. 3/4 tests passed)
No other output. No explanations.`;

const INSTRUCTIONS: Record<string, string> = {
  python: `Return JSON with:
- "prefix": only the import lines needed (e.g. "from typing import List, Optional") — no class, no newline at end
- "editable": the complete Solution class with the correct method signature and "pass" as the body
- "suffix": a standalone if __name__ == '__main__': block that is a test runner.
${TEST_RUNNER_RULES}
Python comparison tip: use sorted(result) == sorted(expected) when order doesn't matter, == otherwise.`,

  javascript: `Return JSON with:
- "prefix": empty string ""
- "editable": just the var function definition with an empty body
- "suffix": a test runner block (no function wrapper needed, just statements).
${TEST_RUNNER_RULES}
JS comparison tip: use JSON.stringify([...result].sort()) === JSON.stringify([...expected].sort()) when order doesn't matter.`,

  java: `Return JSON with:
- "prefix": only import lines (e.g. "import java.util.*;") — no class wrapper
- "editable": a complete standalone Solution class with the correct method signature and empty body
- "suffix": a separate TestRunner class with a main method that is a test runner.
${TEST_RUNNER_RULES}
Java comparison tip: use Arrays.equals() for primitive arrays, Arrays.sort() + Arrays.equals() when order doesn't matter, use .equals() for objects/Lists.`,

  "c++": `Return JSON with:
- "prefix": only headers (e.g. "#include <bits/stdc++.h>\\nusing namespace std;") — no class
- "editable": a complete standalone Solution class with the correct method signature and empty body
- "suffix": a main() function that is a test runner.
${TEST_RUNNER_RULES}
C++ comparison tip: sort both vectors before comparing when order doesn't matter.`,
};

function fallback(language: string): StarterResponse {
  const f: Record<string, StarterResponse> = {
    python: {
      prefix: "from typing import List, Optional",
      editable: "class Solution:\n    def solution(self):\n        pass",
      suffix:
        "\nif __name__ == '__main__':\n    sol = Solution()\n    r = sol.solution()\n    e = None\n    passed = r == e\n    print('[PASS] Test 1' if passed else f'[FAIL] Test 1: expected {e} got {r}')\n    print('---')\n    print('1/1 tests passed' if passed else '0/1 tests passed')",
    },
    javascript: {
      prefix: "",
      editable: "var solution = function() {\n    \n};",
      suffix:
        "\nlet r1 = solution();\nlet e1 = null;\nlet p1 = JSON.stringify(r1) === JSON.stringify(e1);\nconsole.log(p1 ? '[PASS] Test 1' : `[FAIL] Test 1: expected ${e1} got ${r1}`);\nconsole.log('---');\nconsole.log(p1 ? '1/1 tests passed' : '0/1 tests passed');",
    },
    java: {
      prefix: "import java.util.*;",
      editable:
        "class Solution {\n    public Object solution() {\n        \n        return null;\n    }\n}",
      suffix:
        "\nclass TestRunner {\n    public static void main(String[] args) {\n        Solution sol = new Solution();\n        int pass = 0, total = 1;\n        Object r1 = sol.solution();\n        if (r1 == null) { System.out.println(\"[PASS] Test 1\"); pass++; }\n        else System.out.println(\"[FAIL] Test 1: expected null got \" + r1);\n        System.out.println(\"---\");\n        System.out.println(pass + \"/\" + total + \" tests passed\");\n    }\n}",
    },
    "c++": {
      prefix: "#include <bits/stdc++.h>\nusing namespace std;",
      editable:
        "class Solution {\npublic:\n    void solution() {\n        \n    }\n};",
      suffix:
        "\nint main() {\n    Solution sol;\n    sol.solution();\n    cout << \"[PASS] Test 1\" << endl;\n    cout << \"---\" << endl;\n    cout << \"1/1 tests passed\" << endl;\n    return 0;\n}",
    },
  };
  return f[language] ?? f["python"];
}

export async function POST(req: NextRequest) {
  const { prompt, language, testCases = [] } = (await req.json()) as {
    prompt: string;
    language: string;
    testCases?: string[];
  };

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json(fallback(language));

  const instructions = INSTRUCTIONS[language] ?? INSTRUCTIONS["python"];
  const examplesBlock =
    testCases.length > 0
      ? `\nVisible examples:\n${testCases.map((tc, i) => `  Example ${i + 1}: ${tc}`).join("\n")}`
      : "";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        max_tokens: 1200,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You generate LeetCode-style coding challenge starter code split into three parts. Always respond with valid JSON.",
          },
          {
            role: "user",
            content: `Problem: ${prompt}${examplesBlock}
Language: ${language}

${instructions}

Additional rules:
- Infer the exact method name (camelCase), parameter names, types, and return type from the problem.
- Leave the editable method body completely empty (just pass / empty braces / return null).
- Output only valid JSON with exactly three keys: prefix, editable, suffix.`,
          },
        ],
      }),
    });

    if (!response.ok) return NextResponse.json(fallback(language));

    const data = (await response.json()) as {
      choices: { message: { content: string } }[];
    };

    const parsed = JSON.parse(
      data.choices[0]?.message?.content ?? "{}"
    ) as Partial<StarterResponse>;

    if (!parsed.editable) return NextResponse.json(fallback(language));

    return NextResponse.json({
      prefix: parsed.prefix ?? "",
      editable: parsed.editable,
      suffix: parsed.suffix ?? "",
    } satisfies StarterResponse);
  } catch {
    return NextResponse.json(fallback(language));
  }
}
