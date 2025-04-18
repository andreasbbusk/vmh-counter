import { NextRequest } from "next/server";

// Keep track of all clients connected to the SSE stream
const clients = new Set<ReadableStreamController<Uint8Array>>();
// Current counter value
let currentCount = 0;
// Track previous updates to prevent duplicates
let lastUpdateTime = Date.now();

// Define the event data type
interface CounterEventData {
  count: number;
}

// Helper function to send an update to all connected clients (not exported)
function sendEventToClients(data: CounterEventData) {
  const event = `data: ${JSON.stringify(data)}\n\n`;
  const encoded = new TextEncoder().encode(event);

  // Send to all connected clients
  clients.forEach((client) => {
    try {
      client.enqueue(encoded);
    } catch (error) {
      console.error("Error sending to client:", error);
      // Remove failed clients
      clients.delete(client);
    }
  });
}

// Helper function to get CORS headers
function getCorsHeaders(origin: string | null) {
  // Allow the specific origin or all origins with credentials
  const allowedOrigin = origin || "*";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
  };
}

// Handle OPTIONS preflight request
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");

  return new Response(null, {
    status: 204,
    headers: {
      ...getCorsHeaders(origin),
    },
  });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");

  // Create a new stream
  const stream = new ReadableStream({
    start(controller) {
      // When a new client connects, add them to the set
      clients.add(controller);
      console.log(`Client connected. Total clients: ${clients.size}`);

      // Send the current counter value immediately
      controller.enqueue(
        new TextEncoder().encode(
          `data: ${JSON.stringify({ count: currentCount })}\n\n`
        )
      );

      // Remove the client when they disconnect
      request.signal.addEventListener("abort", () => {
        clients.delete(controller);
        console.log(`Client disconnected. Total clients: ${clients.size}`);
      });
    },
  });

  // Return the stream as an event stream
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      ...getCorsHeaders(origin),
    },
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  try {
    const data = await request.json();

    // Check if this is a valid update with a number
    if (typeof data.count === "number") {
      // Only update if the value is different or if it's been a while since last update
      const now = Date.now();
      if (data.count !== currentCount || now - lastUpdateTime > 5000) {
        currentCount = data.count;
        lastUpdateTime = now;

        // Send the update to all clients
        sendEventToClients({ count: currentCount });
        console.log(
          `Counter updated to ${currentCount}. Broadcasting to ${clients.size} clients.`
        );

        return Response.json(
          {
            success: true,
            count: currentCount,
            clients: clients.size,
          },
          {
            headers: getCorsHeaders(origin),
          }
        );
      }

      return Response.json(
        {
          success: true,
          count: currentCount,
          message: "Value unchanged, no broadcast needed",
        },
        {
          headers: getCorsHeaders(origin),
        }
      );
    }

    return Response.json(
      { error: "Invalid count value" },
      {
        status: 400,
        headers: getCorsHeaders(origin),
      }
    );
  } catch (error) {
    console.error("Error updating count:", error);
    return Response.json(
      { error: "Failed to update count" },
      {
        status: 500,
        headers: getCorsHeaders(origin),
      }
    );
  }
}
