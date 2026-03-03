import { NextResponse } from 'next/server';

type ReasonRequest = {
  locale?: 'en' | 'zh' | 'de';
  agent?: string;
  prompt?: string;
  fallback?: string;
};

function trimReason(text: string) {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 280);
}

async function reasonWithQwen(input: { locale: 'en' | 'zh' | 'de'; agent: string; prompt: string; fallback: string }) {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    return { provider: 'local' as const, text: input.fallback };
  }

  const model = process.env.QWEN_MODEL ?? 'qwen-plus';
  const languageInstruction =
    input.locale === 'zh'
      ? '请用简洁中文返回1-2句专业结论。'
      : input.locale === 'de'
        ? 'Bitte antworte auf Deutsch in 1-2 professionellen Saetzen.'
        : 'Respond in concise English with 1-2 professional sentences.';

  const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 180,
      messages: [
        {
          role: 'system',
          content: 'You are a clinical protocol design copilot. Return concise, audit-friendly reasoning only.'
        },
        {
          role: 'user',
          content: `${languageInstruction}\nAgent: ${input.agent}\nContext: ${input.prompt}`
        }
      ]
    })
  });

  if (!response.ok) {
    return { provider: 'local' as const, text: input.fallback };
  }

  const data = await response.json();
  const content = trimReason(String(data?.choices?.[0]?.message?.content ?? ''));
  return {
    provider: content ? ('qwen' as const) : ('local' as const),
    text: content || input.fallback
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ReasonRequest;
    const locale = (body.locale ?? 'en') as 'en' | 'zh' | 'de';
    const agent = String(body.agent ?? 'ProtocolAgent');
    const prompt = String(body.prompt ?? '').trim();
    const fallback = String(body.fallback ?? 'No additional reasoning.').trim();

    if (!prompt) {
      return NextResponse.json({ ok: true, provider: 'local', text: fallback });
    }

    const result = await reasonWithQwen({ locale, agent, prompt, fallback });
    return NextResponse.json({ ok: true, provider: result.provider, text: result.text });
  } catch {
    return NextResponse.json({ ok: true, provider: 'local', text: 'Local fallback reasoning applied.' });
  }
}
