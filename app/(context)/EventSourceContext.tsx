"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { database } from "../../firebase";
import { ref, onValue } from "firebase/database";
import { useCounter } from "./CounterContext";

interface EventSourceContextType {
  isConnected: boolean;
}

const EventSourceContext = createContext<EventSourceContextType | undefined>(
  undefined
);

const DB_REF = "counter";

export function EventSourceProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const { updateCountLocally } = useCounter();

  // Use Firebase Realtime Database for live updates instead of SSE
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      // Get reference to counter in Firebase
      const counterRef = ref(database, DB_REF);

      // Set initial connection state
      setIsConnected(true);

      // Listen for changes to the counter value
      const unsubscribe = onValue(
        counterRef,
        (snapshot) => {
          const data = snapshot.val();
          // Successfully connected
          setIsConnected(true);

          if (
            data !== null &&
            typeof data.value === "number" &&
            !isNaN(data.value)
          ) {
            console.log("Received Firebase update:", data.value);
            updateCountLocally(data.value);
          }
        },
        (error) => {
          // Error handling
          console.error("Firebase connection error:", error);
          setIsConnected(false);
        }
      );

      // Clean up on unmount
      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up Firebase connection:", error);
      setIsConnected(false);
      return () => {}; // Empty cleanup function
    }
  }, [updateCountLocally]);

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
