"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { database } from "../firebase";
import { ref, onValue, set } from "firebase/database";
import { useCounter } from "./CounterContext";

interface SocketContextType {
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);
const DB_REF = "counter";

export function SocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const { count, updateCountLocally } = useCounter();

  // Initialize Firebase connection
  useEffect(() => {
    // Client-side only
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
            console.log("Received Firebase socket update:", data.value);
            updateCountLocally(data.value);
          }
        },
        (error) => {
          // Error handling
          console.error("Firebase socket connection error:", error);
          setIsConnected(false);
        }
      );

      // Clean up on unmount
      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up Firebase socket connection:", error);
      setIsConnected(false);
      return () => {}; // Empty cleanup function
    }
  }, [updateCountLocally]);

  // Update the Firebase counter when the local count changes
  useEffect(() => {
    if (isConnected && typeof window !== "undefined") {
      try {
        const counterRef = ref(database, DB_REF);
        set(counterRef, {
          value: count,
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error updating Firebase counter:", error);
      }
    }
  }, [count, isConnected]);

  return (
    <SocketContext.Provider value={{ isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
