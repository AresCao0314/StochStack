import type { AgentName, AgentRunResult, ContextRoot } from '@/lib/opsTwin/types';

function fallbackReasoning(agent: AgentName, context: ContextRoot) {
  const siteCount = context.candidateSites.length;
  const riskCount = context.risks.length;
  const target = context.studyProfile.targetSampleSize;

  if (agent === 'Site_Scout_Agent') {
    return `Prioritized higher-yield sites while balancing startup risk across countries; ${siteCount} candidates were considered.`;
  }
  if (agent === 'Risk_Officer_Agent') {
    return `Focused on startup critical-path and enrollment drag signals; ${riskCount} risk items are active.`;
  }
  if (agent === 'Recruitment_Dynamics_Agent') {
    return `Projected trajectory against target enrollment ${target} with competition and screen-fail adjustments.`;
  }
  return 'Synthesized current context signals and produced a constrained recommendation for the next handoff.';
}

async function callQwen(prompt: string) {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    throw new Error('DASHSCOPE_API_KEY not configured');
  }

  const model = process.env.QWEN_MODEL ?? 'qwen-plus';
  const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 120,
      messages: [
        {
          role: 'system',
          content:
            'You are an operations reasoning engine. Return one concise rationale sentence (<35 words), no markdown.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Qwen request failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('Empty Qwen response');
  }
  return content.replace(/\s+/g, ' ');
}

export async function enrichAgentResultWithReasoning(params: {
  agent: AgentName;
  context: ContextRoot;
  result: AgentRunResult;
  llmReasoning: boolean;
}) {
  const { agent, context, result, llmReasoning } = params;

  let rationale = fallbackReasoning(agent, context);

  if (llmReasoning) {
    try {
      const prompt = `Agent=${agent}\nStudy=${context.studyProfile.therapeuticArea} phase ${context.studyProfile.phase}\nTarget=${context.studyProfile.targetSampleSize}\nCountries=${context.studyProfile.countries.join(', ')}\nReturn rationale for this agent step.`;
      rationale = await callQwen(prompt);
    } catch {
      // keep fallback rationale
    }
  }

  return {
    ...result,
    messages: result.messages.map((msg, idx) =>
      idx === 0
        ? {
            ...msg,
            text: `${msg.text}\nLLM rationale: ${rationale}`
          }
        : msg
    )
  };
}
