import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runDeepResearch } from "@/lib/research";

const researchSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  jobDescription: z.string().min(10),
  candidateFocus: z.string().optional(),
  mode: z.enum(["behavioral", "technical", "mixed"]),
});

export async function POST(request: NextRequest) {
  try {
    const payload = researchSchema.parse(await request.json());
    const report = await runDeepResearch(payload);
    return NextResponse.json({ report });
  } catch {
    // Always return 200 — null means research unavailable
    return NextResponse.json({ report: null });
  }
}
