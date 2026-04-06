import { RealtimeSessionPayload } from "@/lib/interview/types";

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
