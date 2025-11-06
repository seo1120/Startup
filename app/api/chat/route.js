import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request) {
    try {
        const { question, pillars } = await request.json();
        
        if (!question) {
            return NextResponse.json(
                { error: '질문이 필요합니다.' },
                { status: 400 }
            );
        }
        
        if (!pillars) {
            return NextResponse.json(
                { error: '사주 정보가 필요합니다. 먼저 사주를 계산해주세요.' },
                { status: 400 }
            );
        }
        
        // Google Generative AI 초기화
        const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('GOOGLE_API_KEY or GEMINI_API_KEY environment variable is not set');
            return NextResponse.json(
                { 
                    error: 'AI 서비스가 설정되지 않았습니다.',
                    message: 'GOOGLE_API_KEY 또는 GEMINI_API_KEY 환경 변수를 설정해주세요.'
                },
                { status: 500 }
            );
        }
        
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // 사주 정보를 텍스트로 변환
        const sajuInfo = `
Saju Information:
- Year Pillar: ${pillars.year_pillar || 'N/A'}
- Month Pillar: ${pillars.month_pillar || 'N/A'}
- Day Pillar: ${pillars.day_pillar || 'N/A'}
- Hour Pillar: ${pillars.hour_pillar || 'N/A'}
- Five Elements: 
  * Wood: ${pillars.five_elements?.wood || 0}
  * Fire: ${pillars.five_elements?.fire || 0}
  * Earth: ${pillars.five_elements?.earth || 0}
  * Metal: ${pillars.five_elements?.metal || 0}
  * Water: ${pillars.five_elements?.water || 0}
        `.trim();
        
        // 프롬프트 구성
        const prompt = `You are a traditional Saju expert. Please provide consultation based on the user's Saju information.

${sajuInfo}

User's Question: ${question}

Response Guidelines:
1. Keep your response concise, within 5-8 lines.
2. Use tables (markdown table format) only when it's appropriate and natural for the question. Don't force tables if they're not suitable for the question.
3. When using tables, include rankings and reasons for each item.
4. Add a summary paragraph at the end.
5. Use simple language and avoid overly complex explanations.
6. Provide specific examples when possible.

Based on the Saju information above, please answer the user's question in a friendly and accurate manner. Please respond in English. Provide practical and helpful advice based on Saju interpretation.`;

        console.log('Chat request received:', { question, pillars });
        
        // gemini-2.5-flash 모델 사용 - 스트리밍으로 변경
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        
        // ReadableStream을 사용한 스트리밍 응답
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const result = await model.generateContentStream(prompt);
                    let fullText = '';
                    
                    // 스트리밍 응답을 클라이언트로 전송
                    for await (const chunk of result.stream) {
                        const chunkText = chunk.text();
                        fullText += chunkText;
                        // 각 청크를 클라이언트로 전송
                        const data = `data: ${JSON.stringify({ chunk: chunkText, done: false })}\n\n`;
                        controller.enqueue(new TextEncoder().encode(data));
                    }
                    
                    // 완료 신호 전송
                    const finalData = `data: ${JSON.stringify({ chunk: '', done: true, fullText: fullText })}\n\n`;
                    controller.enqueue(new TextEncoder().encode(finalData));
                    controller.close();
                    
                    console.log('AI response streamed successfully');
                } catch (streamError) {
                    const errorData = `data: ${JSON.stringify({ error: streamError.message, done: true })}\n\n`;
                    controller.enqueue(new TextEncoder().encode(errorData));
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
        
    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { 
                error: 'AI consultation service error occurred.',
                message: error.message 
            },
            { status: 500 }
        );
    }
}

