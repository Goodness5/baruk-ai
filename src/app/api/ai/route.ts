import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const apiKey = process.env.FIREWORKS_KEY;
  const model = 'accounts/secdad1-dce50d/deployedModels/neo-v1-dgemdq13';

  const response = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false
    })
  });

  if (!response.ok) {
    return NextResponse.json({ error: 'AI request failed' }, { status: 500 });
  }

  const data = await response.json();
  return NextResponse.json(data);
}
