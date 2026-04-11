import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { code, language } = (await req.json()) as {
    code: string;
    language: string;
  };

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ code });

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
        max_tokens: 800,
        messages: [
          {
            role: "system",
            content:
              "You are a code formatter. Reformat and properly indent the code the user gives you. Return ONLY the formatted code — no markdown fences, no explanation.",
          },
          {
            role: "user",
            content: `Format this ${language} code:\n\n${code}`,
          },
        ],
      }),
    });

    if (!response.ok) return NextResponse.json({ code });

    const data = (await response.json()) as {
      choices: { message: { content: string } }[];
    };

    const formatted = data.choices[0]?.message?.content?.trim() ?? code;
    return NextResponse.json({ code: formatted });
  } catch {
    return NextResponse.json({ code });
  }
}
