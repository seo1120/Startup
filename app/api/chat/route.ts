import { NextRequest } from 'next/server';
import OpenAI from 'openai';

function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') return '';
  return input.trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, sajuData, sajuAnalysis } = body;
    
    if (!question || typeof question !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Question is required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sanitizedQuestion = sanitizeInput(question, 2000);
    if (sanitizedQuestion.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Question cannot be empty.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!sajuData || typeof sajuData !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Saju data is required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!sajuData.pillars || !sajuData.solar || !sajuData.fiveElements) {
      return new Response(
        JSON.stringify({ error: 'Invalid saju data format.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY environment variable is not set');
      return new Response(
        JSON.stringify({ error: 'AI service unavailable.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const openai = new OpenAI({ 
      apiKey,
      timeout: 30000,
      maxRetries: 2
    });

    // 사주 요약 (LLM 참고용)
    const briefSajuSummary = `
      Year: ${sajuData.pillars.year.hanja}, 
      Month: ${sajuData.pillars.month.hanja}, 
      Day: ${sajuData.pillars.day.hanja}, 
      Hour: ${sajuData.pillars.hour.hanja}. 
      Day Master: ${sajuData.fiveElements.dayMaster.stem} (${sajuData.fiveElements.dayMaster.element}, ${sajuData.fiveElements.dayMaster.strength}). 
      Elements: ${Object.entries(sajuData.fiveElements.elements)
        .map(([k, v]) => `${k}:${v}`).join(', ')}.
    `.trim();

    console.log('Chat request received:', { question });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        const sendChunk = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          // 💡 루미 핵심: 사주 전체 분석을 함께 넘김
          const openaiStream = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            stream: true,
            temperature: 0.3,
            max_tokens: 120,
            presence_penalty: 0.2,
            frequency_penalty: 0.2,
            stop: ['\n'],
            messages: [
              {
                role: 'system',
                content: `
You are a precise, grounded Saju-based wellness advisor. 

You MUST answer ONLY based on the person's Saju profile AND the full analysis below.

Never invent facts. Never contradict the existing analysis. Never generalize broadly.

Answer in EXACTLY 1–2 sentences (max 35 words).

Be concise, clear, and helpful — not poetic.

If the user asks something outside Saju's scope (like fortune predictions, specific dates, or unrelated topics),
gently redirect to personality tendencies, energy patterns, emotional dynamics, or strengths based on the existing analysis.

--- SAJU SUMMARY ---

${briefSajuSummary}

--- FULL ANALYSIS (REFERENCE) ---

${sajuAnalysis || 'None'}
                `
              },
              {
                role: 'user',
                content: sanitizedQuestion
              }
            ]
          });

          let fullText = '';
          let sentenceCount = 0;

          for await (const chunk of openaiStream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (!content) continue;

            fullText += content;

            // 문장 단위 체크
            if (/[.!?]/.test(content)) sentenceCount++;

            if (sentenceCount >= 2) {
              fullText = fullText.trim();
              sendChunk({ chunk: '', done: true, fullText });
              controller.close();
              return;
            }

            // 35 단어 제한
            const words = fullText.trim().split(/\s+/);
            if (words.length >= 35) {
              fullText = words.slice(0, 35).join(' ');
              sendChunk({ chunk: '', done: true, fullText });
              controller.close();
              return;
            }

            sendChunk({ chunk: content, done: false });
          }

          sendChunk({ chunk: '', done: true, fullText });
          controller.close();

        } catch (err) {
          console.error('Streaming error:', err);
          sendChunk({ error: 'An error occurred. Try again soon.', done: true });
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Unexpected server error.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
