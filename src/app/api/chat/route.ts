import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const { messages, model = 'phi3.5', serverUrl = 'http://localhost:11434' } =
    await request.json();

  let ollamaResponse: Response;
  try {
    ollamaResponse = await fetch(`${serverUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: true }),
    });
  } catch {
    return new Response(
      JSON.stringify({ error: `Cannot reach inference server at ${serverUrl}` }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!ollamaResponse.ok) {
    const errText = await ollamaResponse.text().catch(() => '');
    return new Response(
      JSON.stringify({ error: `Inference server error: ${ollamaResponse.status} ${errText}` }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = ollamaResponse.body!.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter((l) => l.trim());

          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.message?.content) {
                controller.enqueue(encoder.encode(data.message.content));
              }
              if (data.done) {
                controller.close();
                return;
              }
            } catch {
              // partial JSON line, skip
            }
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
