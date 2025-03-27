"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  ReactNode,
  useEffect,
} from "react";

interface CounterContextType {
  count: number;
  setCount: (count: number) => void;
  updateCountLocally: (count: number) => void;
}

const CounterContext = createContext<CounterContextType | undefined>(undefined);

const STORAGE_KEY = "vmh-counter-value";

export function CounterProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const isUpdatingRef = useRef(false);

  // Load the counter value from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedValue = localStorage.getItem(STORAGE_KEY);
      if (storedValue) {
        try {
          const parsedValue = JSON.parse(storedValue);
          if (typeof parsedValue === "number" && !isNaN(parsedValue)) {
            setCount(parsedValue);
          }
        } catch (error) {
          console.error("Failed to parse stored counter value:", error);
        }
      }
      setIsLoaded(true);
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
