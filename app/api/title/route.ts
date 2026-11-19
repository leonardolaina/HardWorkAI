import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { userMessage, assistantMessage } = (await req.json()) as {
      userMessage?: string;
      assistantMessage?: string;
    };

    if (!userMessage?.trim()) {
      return NextResponse.json({ title: 'Nova conversa' });
    }

    const ai = getGeminiClient();
    const prompt = [
      'Gere um título curto, natural e descritivo (entre 2 e 6 palavras) no mesmo idioma da mensagem do usuário, sem aspas, sem ponto final e sem prefixos.',
      `Usuário: ${userMessage.slice(0, 400)}`,
      assistantMessage ? `Assistente: ${assistantMessage.slice(0, 300)}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
    });

    const cleaned = (response.text ?? '')
      .replace(/^["'«»\s]+|["'«».\s]+$/g, '')
      .split('\n')[0]
      .slice(0, 64)
      .trim();

    return NextResponse.json({ title: cleaned || userMessage.slice(0, 48).trim() });
  } catch {
    return NextResponse.json({ title: '' });
  }
}
