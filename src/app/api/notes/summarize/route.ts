import { NextResponse } from 'next/server';

type SummarizeRequest = {
  text?: string;
  locale?: 'en' | 'zh' | 'de';
};

function localFallback(text: string) {
  const normalized = text
    .replace(/\r/g, '\n')
    .split(/\n+/)
    .flatMap((part) => part.split(/[。！？.!?;；]/g))
    .map((line) => line.trim())
    .filter(Boolean);

  const deduped: string[] = [];
  for (const line of normalized) {
    if (deduped.length >= 6) break;
    if (!deduped.includes(line)) deduped.push(line);
  }

  return deduped.length > 0 ? deduped : [text.trim().slice(0, 120)];
}

function parseBullets(raw: string) {
  const lines = raw
    .split('\n')
    .map((line) => line.replace(/^\s*[-*•\d.)]+\s*/, '').trim())
    .filter(Boolean);

  const filtered = lines.filter((line) => !line.startsWith('{') && !line.startsWith('```'));
  return filtered.slice(0, 6);
}

async function summarizeWithQwen(text: string, locale: 'en' | 'zh' | 'de') {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    return {
      provider: 'local-fallback' as const,
      bullets: localFallback(text)
    };
  }

  const model = process.env.QWEN_MODEL ?? 'qwen-plus';
  const languageInstruction =
    locale === 'zh'
      ? 'Use Chinese concise bullet points.'
      : locale === 'de'
        ? 'Use concise German bullet points.'
        : 'Use concise English bullet points.';

  const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content:
            'You are an editorial assistant. Convert user raw notes into 3-6 crisp bullet points. No markdown title, no commentary.'
        },
        {
          role: 'user',
          content: `${languageInstruction}\n\nRaw notes:\n${text}`
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Qwen request failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content ?? '';
  const bullets = parseBullets(content);

  if (bullets.length === 0) {
    return {
      provider: 'local-fallback' as const,
      bullets: localFallback(text)
    };
  }

  return {
    provider: 'qwen' as const,
    bullets
  };
}

export async function POST(request: Request) {
  let text = '';
  try {
    const body = (await request.json()) as SummarizeRequest;
    text = (body.text ?? '').trim();
    const locale = (body.locale ?? 'en') as 'en' | 'zh' | 'de';

    if (text.length < 4) {
      return NextResponse.json({ ok: false, error: 'Text is too short.' }, { status: 400 });
    }

    const result = await summarizeWithQwen(text, locale);

    return NextResponse.json({
      ok: true,
      provider: result.provider,
      bullets: result.bullets
    });
  } catch {
    return NextResponse.json({
      ok: true,
      provider: 'local-fallback',
      bullets: text ? localFallback(text) : []
    });
  }
}
