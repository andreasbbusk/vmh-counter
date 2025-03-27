"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useCounter } from "./CounterContext";

interface SocketContextType {
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

// Socket instance outside the component to persist across renders
let socket: Socket | null = null;

export function SocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const { count, updateCountLocally } = useCounter();

  // Initialize socket connection
  useEffect(() => {
    // Client-side only
    if (typeof window === "undefined") return;

    function setupSocket() {
      try {
        // Initialize socket connection if it doesn't exist
        if (!socket) {
          console.log("Initializing socket connection...");
          const socketUrl = window.location.origin;
          socket = io(socketUrl, {
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 5000,
            transports: ["websocket", "polling"],
          });
        }

        // Set up event listeners
        function onConnect() {
          console.log("Connected to socket server");
          setIsConnected(true);
        }

        function onDisconnect() {
          console.log("Disconnected from socket server");
          setIsConnected(false);
        }

        function onError(error: Error) {
          console.error("Socket error:", error);
          setIsConnected(false);
        }

        function onCountUpdate(newCount: number) {
          console.log("Received count update:", newCount);
          updateCountLocally(newCount);
        }

        function onConnectError(error: Error) {
          console.error("Connection error:", error);
          setIsConnected(false);
        }

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("error", onError);
        socket.on("connect_error", onConnectError);
        socket.on("count-update", onCountUpdate);

        // Clean up listeners on unmount
        return () => {
          if (socket) {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("error", onError);
            socket.off("connect_error", onConnectError);
            socket.off("count-update", onCountUpdate);
          }
        };
      } catch (error) {
        console.error("Error setting up socket:", error);
        setIsConnected(false);
        return () => {};
      }
    }

    const cleanup = setupSocket();
    return cleanup;
  }, [updateCountLocally]);

  // Emit count updates to the server whenever count changes locally
  useEffect(() => {
    if (socket && isConnected) {
      try {
        socket.emit("update-count", count);
      } catch (error) {
        console.error("Error emitting count update:", error);
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
