import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { simulateCodeExecution } from "@/lib/openai";

const executeSchema = z.object({
  language: z.string(),
  version: z.string(),
  files: z.array(z.object({ content: z.string() })).min(1),
});

export async function POST(request: NextRequest) {
  try {
    const payload = executeSchema.parse(await request.json());
    const code = payload.files[0].content;

    const result = await simulateCodeExecution(payload.language, code, payload.version);

    return NextResponse.json({
      run: {
        stdout: result.stdout,
        stderr: result.stderr,
        code: result.exitCode
      }
    });
  } catch (error) {
    console.error("Execution error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Execution simulation failed" },
      { status: 500 }
    );
  }
}
