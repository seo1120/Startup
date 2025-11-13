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
    
    // 입력 검증
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
        JSON.stringify({ error: 'Saju data is required. Please calculate your Saju first.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 필수 필드 검증
    if (!sajuData.pillars || !sajuData.solar || !sajuData.fiveElements) {
      return new Response(
        JSON.stringify({ error: 'Invalid saju data format.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // OpenAI 초기화
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY environment variable is not set');
      return new Response(
        JSON.stringify({ 
          error: 'I apologize, but the AI service is currently unavailable. Please try again later.'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const openai = new OpenAI({ 
      apiKey: apiKey,
      timeout: 30000,
      maxRetries: 2
    });
    
    // 간단한 사주 요약만 포함
    const briefSajuSummary = `Pillars: ${sajuData.pillars.year.hanja} ${sajuData.pillars.month.hanja} ${sajuData.pillars.day.hanja} ${sajuData.pillars.hour.hanja}. Day Master: ${sajuData.fiveElements.dayMaster.stem} (${sajuData.fiveElements.dayMaster.element}, ${sajuData.fiveElements.dayMaster.strength === '강' ? 'Strong' : sajuData.fiveElements.dayMaster.strength === '중' ? 'Moderate' : 'Weak'}). Elements: ${Object.entries(sajuData.fiveElements.elements).map(([k, v]) => `${k}:${v}`).join(', ')}.`;
    
    console.log('Chat request received:', { question, hasSajuData: !!sajuData, hasAnalysis: !!sajuAnalysis });
    
    // 스트리밍 응답 생성
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        const sendChunk = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };
        
        try {
          const openaiStream = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are a Saju consultant. Answer in EXACTLY 1-2 sentences. Maximum 30 words. NO lists, NO examples, NO explanations. Just answer directly. Saju: ${briefSajuSummary}`
              },
              {
                role: 'user',
                content: sanitizedQuestion
              }
            ],
            stream: true,
            temperature: 0.1,
            max_tokens: 100, // 30단어 완전한 응답을 위해 충분한 토큰 할당
            presence_penalty: 2,
            frequency_penalty: 2,
            stop: ['\n\n', '###', '##', '#'] // OpenAI API는 최대 4개의 stop 토큰만 허용
          });
          
          let fullText = '';
          const maxSentences = 2;
          
          for await (const chunk of openaiStream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullText += content;
              
              // 실시간으로 문장 종료 문자 체크
              const sentenceEndings = (fullText.match(/[.!?]+/g) || []).length;
              
              // 2문장이 완성되면 즉시 중단
              if (sentenceEndings >= maxSentences) {
                let count = 0;
                let cutIndex = -1;
                for (let i = 0; i < fullText.length; i++) {
                  if (/[.!?]/.test(fullText[i])) {
                    count++;
                    if (count === maxSentences) {
                      cutIndex = i + 1;
                      break;
                    }
                  }
                }
                
                if (cutIndex > 0) {
                  fullText = fullText.substring(0, cutIndex).trim();
                }
                
                sendChunk({ chunk: '', done: true, fullText: fullText });
                controller.close();
                console.log('Response truncated at 2 sentences');
                return;
              }
              
              // 단어 수 체크 (30단어 초과 시 중단)
              const wordCount = fullText.trim().split(/\s+/).length;
              if (wordCount > 30) {
                const words = fullText.trim().split(/\s+/).slice(0, 30);
                fullText = words.join(' ');
                if (!/[.!?]/.test(fullText)) {
                  const lastSentenceEnd = fullText.lastIndexOf(/[.!?]/.exec(fullText)?.[0] || '.');
                  if (lastSentenceEnd > 0) {
                    fullText = fullText.substring(0, lastSentenceEnd + 1);
                  }
                }
                sendChunk({ chunk: '', done: true, fullText: fullText });
                controller.close();
                console.log('Response truncated at 30 words');
                return;
              }
              
              // 각 청크를 클라이언트로 전송
              sendChunk({ chunk: content, done: false });
            }
          }
          
          // 최종 응답 강제 제한
          const sentenceEndings = (fullText.match(/[.!?]/g) || []).length;
          if (sentenceEndings > maxSentences) {
            let count = 0;
            let cutIndex = -1;
            for (let i = 0; i < fullText.length; i++) {
              if (/[.!?]/.test(fullText[i])) {
                count++;
                if (count === maxSentences) {
                  cutIndex = i + 1;
                  break;
                }
              }
            }
            if (cutIndex > 0) {
              fullText = fullText.substring(0, cutIndex).trim();
            }
          }
          
          // 단어 수도 체크
          const wordCount = fullText.trim().split(/\s+/).length;
          if (wordCount > 30) {
            const words = fullText.trim().split(/\s+/).slice(0, 30);
            fullText = words.join(' ');
            if (!/[.!?]/.test(fullText)) {
              const lastSentenceEnd = fullText.lastIndexOf(/[.!?]/.exec(fullText)?.[0] || '.');
              if (lastSentenceEnd > 0) {
                fullText = fullText.substring(0, lastSentenceEnd + 1);
              }
            }
          }
          
          // 완료 신호 전송
          sendChunk({ chunk: '', done: true, fullText: fullText });
          controller.close();
          
          console.log('AI response streamed successfully');
        } catch (streamError: any) {
          console.error('Streaming error:', streamError);
          // 사용자 친화적인 에러 메시지
          sendChunk({ error: 'I apologize, but I encountered an issue while processing your question. Please try again in a moment.', done: true });
          controller.close();
        }
      }
    });
    
    // 스트리밍 응답 반환
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
      JSON.stringify({ 
        error: 'I apologize, but I encountered an issue. Please try again in a moment.'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

