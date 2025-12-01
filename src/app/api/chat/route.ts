// import { NextResponse } from "next/server"

// export async function POST(req: Request) {
//   try {
//     const { message, history = [] } = await req.json()

//     const encoder = new TextEncoder()

//     const stream = new ReadableStream({
//       async start(controller) {
//         try {
//           let contextPrompt = message
//           if (history.length > 0) {
//             const contextMessages = history
//               .slice(-10) // Keep last 10 messages for context
//               .map((msg: any) => `${msg.role === "user" ? "Human" : "Assistant"}: ${msg.content}`)
//               .join("\n")
//             contextPrompt = `Previous conversation:\n${contextMessages}\n\nHuman: ${message}\nAssistant:`
//           }

//           const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(contextPrompt)}`)

//           if (!res.ok) {
//             let errorMessage = "Something went wrong"

//             if (res.status === 502) {
//               errorMessage = "⚠️ The service is temporarily unavailable. Please try again later."
//             } else if (res.status === 400) {
//               errorMessage = "⚠️ There was an issue with your request. Please rephrase and try again."
//             }

//             // Log the raw error for debugging
//             console.error("[API Error]", {
//               status: res.status,
//               statusText: res.statusText,
//               url: res.url,
//             })

//             controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`))
//             controller.close()
//             return
//           }

//           const reply = await res.text()

//           if (reply.toLowerCase().includes("azure-openai") || reply.toLowerCase().includes("content_filter")) {
//             const errorMessage = "⚠️ Your request triggered content filtering policies. Please rephrase your message."
//             console.error("[Content Filter Error]", reply)
//             controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`))
//             controller.close()
//             return
//           }

//           // Stream the response character by character
//           for (let i = 0; i < reply.length; i++) {
//             const chunk = reply.slice(0, i + 1)
//             controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`))
//             // Add small delay for streaming effect
//             await new Promise((resolve) => setTimeout(resolve, 20))
//           }

//           // Send final message to indicate completion
//           controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
//           controller.close()
//         } catch (error) {
//           console.error("[Stream Error]", error)
//           controller.enqueue(
//             encoder.encode(
//               `data: ${JSON.stringify({ error: "⚠️ The service is temporarily unavailable. Please try again later." })}\n\n`,
//             ),
//           )
//           controller.close()
//         }
//       },
//     })

//     return new Response(stream, {
//       headers: {
//         "Content-Type": "text/event-stream",
//         "Cache-Control": "no-cache",
//         Connection: "keep-alive",
//       },
//     })
//   } catch (err) {
//     console.error("[Request Error]", err)
//     return NextResponse.json(
//       { error: "⚠️ There was an issue with your request. Please rephrase and try again." },
//       { status: 500 },
//     )
//   }
// }
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { message, history = [] } = await req.json()
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let contextPrompt = message
          if (history.length > 0) {
            const contextMessages = history
              .slice(-10) // Keep last 10 messages for context
              .map((msg: any) => `${msg.role === "user" ? "Human" : "Assistant"}: ${msg.content}`)
              .join("\n")
            contextPrompt = `Previous conversation:\n${contextMessages}\n\nHuman: ${message}\nAssistant:`
          }

          const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(contextPrompt)}`)

          if (!res.ok || !res.body) {
            let errorMessage = "⚠️ Something went wrong"
            if (res.status === 502) {
              errorMessage = "⚠️ The service is temporarily unavailable. Please try again later."
            } else if (res.status === 400) {
              errorMessage = "⚠️ There was an issue with your request. Please rephrase and try again."
            }

            console.error("[API Error]", {
              status: res.status,
              statusText: res.statusText,
              url: res.url,
            })

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`))
            controller.close()
            return
          }

          // ✅ Real streaming from Pollinations response
          const reader = res.body.getReader()
          const decoder = new TextDecoder()

          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk = decoder.decode(value, { stream: true })

            // Send chunk immediately
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`))
          }

          // Send final message to indicate completion
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
          controller.close()
        } catch (error) {
          console.error("[Stream Error]", error)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "⚠️ The service is temporarily unavailable. Please try again later." })}\n\n`,
            ),
          )
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
    console.error("[Request Error]", err)
    return NextResponse.json(
      { error: "⚠️ There was an issue with your request. Please rephrase and try again." },
      { status: 500 },
    )
  }
}
