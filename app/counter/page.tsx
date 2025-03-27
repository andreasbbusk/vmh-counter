"use client";

import { useCounter } from "../(context)/CounterContext";
import { formatDanishCurrency } from "../(utils)/formatters";
import { useCountAnimation } from "../(utils)/useCountAnimation";
import { useEffect, useState } from "react";
import { database } from "../../firebase";
import { ref, onValue } from "firebase/database";

export default function CounterPage() {
  const { count } = useCounter();
  const [isConnected, setIsConnected] = useState(false);
  const [mounted, setMounted] = useState(false);
  const animatedCount = useCountAnimation(count, 1200, 0);

  // Monitor Firebase connection status
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const connectedRef = ref(database, ".info/connected");
      const unsubscribe = onValue(connectedRef, (snap) => {
        setIsConnected(!!snap.val());
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error monitoring connection status:", error);
      setIsConnected(false);
      return () => {};
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-slate-100 p-4">
      <div className="text-center relative">
        <div className="absolute top-2 right-2 flex items-center">
          <div
            className={`w-0 h-0 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
        </div>

        <div className="bg-white p-10 rounded-2xl shadow-xl mb-10 border border-blue-100">
          <div className="text-7xl md:text-8xl lg:text-9xl font-bold text-[#e0a619]">
            {formatDanishCurrency(animatedCount)}
          </div>
        </div>
      </div>
    </div>
  );
}
