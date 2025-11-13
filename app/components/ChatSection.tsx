'use client';

import { useState, useRef, useEffect } from 'react';

interface ChatSectionProps {
  sajuData: any;
  sajuAnalysis: string | null;
  onAnalysisUpdate: (analysis: string) => void;
}

interface Message {
  type: 'user' | 'bot';
  content: string;
}

const ChatSection = ({ sajuData, sajuAnalysis, onAnalysisUpdate }: ChatSectionProps) => {
  const [messages, setMessages] = useState<Message[]>([
    { type: 'bot', content: 'Hello! What would you like to know about your Saju? Please feel free to ask any questions. 😊' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    if (!sajuData) {
      alert('Please calculate your Saju first.');
      return;
    }

    const userMessage: Message = { type: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // 사주 풀이가 없으면 먼저 생성
    let currentAnalysis: string | null = sajuAnalysis;
    if (!currentAnalysis) {
      try {
        const analysisResponse = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sajuData }),
        });

        if (analysisResponse.ok) {
          try {
            const analysisResult = await analysisResponse.json();
            if (analysisResult.success && analysisResult.analysis) {
              currentAnalysis = analysisResult.analysis;
              if (currentAnalysis) {
                onAnalysisUpdate(currentAnalysis);
              }
            }
          } catch (e) {
            console.error('Failed to parse analysis response:', e);
          }
        }
      } catch (err) {
        console.error('Failed to generate analysis:', err);
      }
    }

    // 로딩 메시지 추가
    const loadingMessage: Message = { type: 'bot', content: 'Generating response...' };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage.content,
          sajuData,
          sajuAnalysis: currentAnalysis,
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // 로딩 메시지 제거
      setMessages(prev => prev.slice(0, -1));

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let botMessage: Message = { type: 'bot', content: '' };

      setMessages(prev => [...prev, botMessage]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.error) {
                  setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                      type: 'bot',
                      content: data.error,
                    };
                    return newMessages;
                  });
                  break;
                } else if (data.done) {
                  break;
                } else if (data.chunk) {
                  setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                      type: 'bot',
                      content: newMessages[newMessages.length - 1].content + data.chunk,
                    };
                    return newMessages;
                  });
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      setMessages(prev => {
        const newMessages = prev.slice(0, -1);
        newMessages.push({
          type: 'bot',
          content: 'I apologize, but I encountered a connection issue. Please try again in a moment.',
        });
        return newMessages;
      });
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="bg-background p-4 md:p-6 rounded-design">
      <h3 className="text-primary mb-4 md:mb-6 text-gloock-base font-gloock">
        AI Saju Consultation
      </h3>
      <div>
        <div
          ref={chatMessagesRef}
          className="max-h-[300px] md:max-h-[400px] overflow-y-auto p-3 md:p-4 bg-white rounded-[12px] mb-4"
        >
          {messages.map((message, index) => (
            <div
              key={index}
              className={`mb-3 md:mb-4 flex animate-fadeIn ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[85%] md:max-w-[70%] p-3 rounded-[12px] leading-[1.6] text-afacad-sm font-afacad whitespace-pre-wrap break-words ${
                  message.type === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-background text-primary'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex gap-2 md:gap-2.5 items-center">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter your question..."
            rows={2}
            className="flex-1 p-3 border-none rounded-[12px] font-afacad text-afacad-base resize-none bg-white form-input min-h-[60px] md:min-h-[72px]"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="px-4 md:px-6 h-[60px] md:h-[72px] bg-primary text-white border-none rounded-[12px] text-afacad-base font-afacad cursor-pointer transition-all duration-300 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap flex items-center justify-center"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="hidden md:inline">Sending...</span>
              </span>
            ) : (
              'Send'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatSection;

