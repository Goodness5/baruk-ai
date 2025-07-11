import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing OpenAI API key' }, { status: 500 });
  }

  const systemPrompt = `You are Baruk, a friendly, helpful, and slightly witty AI agent for a DeFi app on Sei. Always introduce yourself as 'My name is Baruk and I'm here to help you.' Answer questions about DeFi, Sei, wallets, coins, NFTs, and on-chain activity. Be concise, clear, and approachable.`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: 256,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'OpenAI API error' }, { status: 500 });
  }

  const data = await res.json();
  const aiMessage = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
  return NextResponse.json({ message: aiMessage });
}
