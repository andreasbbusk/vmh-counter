"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import { useCounter } from "./CounterContext";

interface EventSourceContextType {
  isConnected: boolean;
}

const EventSourceContext = createContext<EventSourceContextType | undefined>(
  undefined
);

export function EventSourceProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const { count, updateCountLocally } = useCounter();
  const [isSending, setIsSending] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Use refs to track the last received and sent values
  const lastReceivedCount = useRef<number | null>(null);
  const lastSentCount = useRef<number | null>(null);

  // Initialize EventSource connection
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Create a new EventSource connection with absolute URL
    const baseUrl = window.location.origin;
    const sse = new EventSource(`${baseUrl}/events`, { withCredentials: true });
    eventSourceRef.current = sse;

    // Connection opened
    sse.onopen = () => {
      console.log("SSE connection opened");
      setIsConnected(true);
    };

    // Listen for messages
    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (typeof data.count === "number") {
          // Only update if the count is different from what we last received
          if (data.count !== lastReceivedCount.current) {
            console.log("Received count update:", data.count);
            lastReceivedCount.current = data.count;
            updateCountLocally(data.count);
          }
        }
      } catch (error) {
        console.error("Error parsing SSE message:", error);
      }
    };

    // Error handling
    sse.onerror = (error) => {
      console.error("SSE connection error:", error);
      setIsConnected(false);
      // Try to reconnect
      sse.close();
      eventSourceRef.current = null;

      setTimeout(() => {
        const newSse = new EventSource(`${baseUrl}/events`, {
          withCredentials: true,
        });
        eventSourceRef.current = newSse;
      }, 3000);
    };

    // Clean up on unmount
    return () => {
      sse.close();
      eventSourceRef.current = null;
    };
  }, [updateCountLocally]);

  // Send count updates to the server
  useEffect(() => {
    // Don't send updates if we're not connected, if we're already sending,
    // or if this is the same value we just received or sent
    if (
      !isConnected ||
      isSending ||
      count === lastReceivedCount.current ||
      count === lastSentCount.current
    ) {
      return;
    }

    const sendUpdate = async () => {
      try {
        setIsSending(true);
        console.log("Sending count update:", count);
        lastSentCount.current = count;

        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/events`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ count }),
        });

        if (!response.ok) {
          console.error("Failed to update count:", await response.text());
        }
      } catch (error) {
        console.error("Error sending count update:", error);
      } finally {
        setIsSending(false);
      }
    };

    // Send immediately without delay
    sendUpdate();
  }, [count, isConnected, isSending]);

  return (
    <EventSourceContext.Provider value={{ isConnected }}>
      {children}
    </EventSourceContext.Provider>
  );
}

export function useEventSource() {
  const context = useContext(EventSourceContext);
  if (context === undefined) {
    throw new Error(
      "useEventSource must be used within an EventSourceProvider"
    );
  }
  return context;
}
