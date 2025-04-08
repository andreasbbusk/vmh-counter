"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  ReactNode,
  useEffect,
} from "react";
import { database } from "../firebase";
import { ref, onValue, set, get } from "firebase/database";

interface CounterContextType {
  count: number;
  setCount: (count: number) => void;
  updateCountLocally: (count: number) => void;
}

const CounterContext = createContext<CounterContextType | undefined>(undefined);

const STORAGE_KEY = "vmh-counter-value";
const DB_REF = "counter";

export function CounterProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const isUpdatingRef = useRef(false);

  // Load the counter value from Firebase and fall back to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Get reference to counter in Firebase
      const counterRef = ref(database, DB_REF);

      // Listen for changes to the counter value
      const unsubscribe = onValue(counterRef, (snapshot) => {
        const data = snapshot.val();
        if (
          data !== null &&
          typeof data.value === "number" &&
          !isNaN(data.value)
        ) {
          setCount(data.value);
        } else {
          // If no data in Firebase, try to get from localStorage
          const storedValue = localStorage.getItem(STORAGE_KEY);
          if (storedValue) {
            try {
              const parsedValue = JSON.parse(storedValue);
              if (typeof parsedValue === "number" && !isNaN(parsedValue)) {
                setCount(parsedValue);
                // Also update Firebase with this value
                set(counterRef, {
                  value: parsedValue,
                  updatedAt: new Date().toISOString(),
                });
              }
            } catch (error) {
              console.error("Failed to parse stored counter value:", error);
            }
          }
        }
        setIsLoaded(true);
      });

      return () => unsubscribe();
    }
  }, []);

  // Save the counter value to localStorage when it changes
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(count));
    }
  }, [count, isLoaded]);

  // This function is used by the EventSource to update the counter locally
  // without triggering additional synchronization events
  const updateCountLocally = (newCount: number) => {
    isUpdatingRef.current = true;
    setCount(newCount);
    // Reset the flag after the update has been processed
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 50);
  };

  // Wrapper for setCount that can be used from UI components
  const handleSetCount = (newCount: number) => {
    // Only trigger external updates if we're not already updating
    if (!isUpdatingRef.current) {
      setCount(newCount);

      // Update Firebase with the new value
      const counterRef = ref(database, DB_REF);

      // Get current data first to preserve any special fields
      get(counterRef).then((snapshot) => {
        const currentData = snapshot.val() || {};

        // Create new data object, preserving any special fields
        const newData = {
          ...currentData, // Keep existing data (like special animation flags)
          value: newCount, // Update the value
          updatedAt: new Date().toISOString(),
        };

        // Only update if there's no special animation in progress
        // This prevents interfering with special donations
        if (!currentData.specialAnimation) {
          set(counterRef, newData);
        } else {
          console.log("Skipping counter update during special animation");
        }
      });
    }
  };

  return (
    <CounterContext.Provider
      value={{
        count,
        setCount: handleSetCount,
        updateCountLocally,
      }}
    >
      {children}
    </CounterContext.Provider>
  );
}

export function useCounter() {
  const context = useContext(CounterContext);
  if (context === undefined) {
    throw new Error("useCounter must be used within a CounterProvider");
  }
  return context;
}
