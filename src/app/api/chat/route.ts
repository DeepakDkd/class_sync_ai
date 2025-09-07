import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { message } = await req.json()

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_OPENAI_API}/${encodeURIComponent(message)}`)
          const reply = await res.text()

          // Stream the response character by character
          for (let i = 0; i < reply.length; i++) {
            const chunk = reply.slice(0, i + 1)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`))
            // Add small delay for streaming effect
            await new Promise((resolve) => setTimeout(resolve, 20))
          }

          // Send final message to indicate completion
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
          controller.close()
        } catch (error) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Something went wrong" })}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (err) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
