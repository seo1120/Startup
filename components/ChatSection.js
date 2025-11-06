'use client'

import { useState, useRef, useEffect } from 'react'

export default function ChatSection({ currentSajuData }) {
  const [messages, setMessages] = useState([
    { type: 'bot', content: 'Hello! What would you like to know about your Saju? Please feel free to ask any questions. 😊' }
  ])
  const [question, setQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const chatMessagesRef = useRef(null)
  const questionInputRef = useRef(null)

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
    }
  }, [messages])

  const sendChatMessage = async () => {
    const questionText = question.trim()
    if (!questionText) return
    
    if (!currentSajuData) {
      alert('Please calculate your Saju first.')
      return
    }

    // 사용자 메시지 추가
    setMessages(prev => [...prev, { type: 'user', content: questionText }])
    setQuestion('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: questionText,
          pillars: currentSajuData
        })
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      // 스트리밍 응답 처리
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let botMessage = { type: 'bot', content: '' }
      
      // 초기 봇 메시지 추가
      setMessages(prev => [...prev, botMessage])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.error) {
                botMessage.content = `Error: ${data.error}`
                setMessages(prev => {
                  const newMessages = [...prev]
                  newMessages[newMessages.length - 1] = { ...botMessage }
                  return newMessages
                })
                break
              } else if (data.done) {
                break
              } else if (data.chunk) {
                botMessage.content += data.chunk
                setMessages(prev => {
                  const newMessages = [...prev]
                  newMessages[newMessages.length - 1] = { ...botMessage }
                  return newMessages
                })
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e)
            }
          }
        }
      }

      // 남은 버퍼 처리
      if (buffer.trim()) {
        const lines = buffer.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.chunk && !data.done) {
                botMessage.content += data.chunk
                setMessages(prev => {
                  const newMessages = [...prev]
                  newMessages[newMessages.length - 1] = { ...botMessage }
                  return newMessages
                })
              }
            } catch (e) {
              // ignore
            }
          }
        }
      }

    } catch (error) {
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: `Error: ${error.message || 'Server connection error. Please check if the server is running.'}` 
      }])
      console.error('Chat error:', error)
    } finally {
      setIsLoading(false)
      if (questionInputRef.current) {
        questionInputRef.current.focus()
      }
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendChatMessage()
    }
  }

  return (
    <div className="chat-section">
      <h3>AI Saju Consultation</h3>
      <div className="chat-container">
        <div className="chat-messages" ref={chatMessagesRef}>
          {messages.map((message, index) => (
            <div key={index} className={`chat-message ${message.type}-message`}>
              <div className="message-content">{message.content}</div>
            </div>
          ))}
        </div>
        <div className="chat-input-container">
          <textarea
            ref={questionInputRef}
            id="chatQuestion"
            placeholder="Enter your question..."
            rows="2"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid rgba(87, 69, 25, 0.2)',
              borderRadius: '8px',
              fontFamily: "'Gloock', serif",
              fontSize: '14px',
              resize: 'none',
              background: 'rgba(250, 247, 237, 0.5)',
              backdropFilter: 'blur(5px)',
              WebkitBackdropFilter: 'blur(5px)',
              color: 'var(--color-secondary)'
            }}
          />
          <button
            id="chatSendBtn"
            className="btn-chat-send"
            onClick={sendChatMessage}
            disabled={isLoading || !question.trim()}
          >
            {isLoading ? (
              <>
                <span className="chat-loading"></span> Sending...
              </>
            ) : (
              'Send'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

