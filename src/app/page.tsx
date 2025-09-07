"use client"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Send, Bot, User } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput("")
    setIsLoading(true)
    setStreamingMessage("")

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      })

      if (!res.body) throw new Error("No response body")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let finalContent = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.error) {
                throw new Error(data.error)
              }
              if (data.done) {
                // Streaming complete, add final message
                const assistantMessage: Message = {
                  role: "assistant",
                  content: finalContent,
                  timestamp: new Date(),
                }
                setMessages([...newMessages, assistantMessage])
                setStreamingMessage("")
              } else if (data.content) {
                finalContent = data.content
                setStreamingMessage(data.content)
              }
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } catch (error) {
      const errorMessage: Message = {
        role: "assistant",
        content: "I'm experiencing some technical difficulties. Please try again.",
        timestamp: new Date(),
      }
      setMessages([...newMessages, errorMessage])
      setStreamingMessage("")
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }
  // const formatTime = (date: Date) => {
  // return date.toISOString().slice(11, 16) // "HH:MM" in UTC
// }


  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 bg-primary">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Bot className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-semibold text-foreground">ClassSync AI Assistant</h1>
              <p className="text-sm text-muted-foreground">{isLoading ? "Thinking..." : "Always here to help"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 ${
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback
                    className={
                      message.role === "user"
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-primary text-primary-foreground"
                    }
                  >
                    {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>

                <div className={`flex flex-col max-w-[80%] ${message.role === "user" ? "items-end" : "items-start"}`}>
                  <Card
                    className={`px-4 py-3 shadow-sm border-0 transition-all duration-200 hover:shadow-md ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-card text-card-foreground hover:bg-card/80"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-pretty">{message.content}</p>
                  </Card>
                  <span className="text-xs text-muted-foreground mt-1 px-1">{formatTime(message.timestamp)}</span>
                </div>
              </div>
            ))}

            {streamingMessage && (
              <div className="flex gap-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col max-w-[80%] items-start">
                  <Card className="px-4 py-3 bg-card text-card-foreground shadow-sm border-0 hover:bg-card/80 transition-all duration-200">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-pretty">
                      {streamingMessage}
                      <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse"></span>
                    </p>
                  </Card>
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && !streamingMessage && (
              <div className="flex gap-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <Card className="px-4 py-3 bg-card text-card-foreground shadow-sm border-0">
                  <div className="flex items-center gap-1">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    </div>
                    <span className="text-sm text-muted-foreground ml-2">Thinking...</span>
                  </div>
                </Card>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  disabled={isLoading}
                  className="min-h-[44px] resize-none bg-background border-border focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                />
              </div>
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-[44px] w-[44px] shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Press Enter to send, Shift + Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
