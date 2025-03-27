"use client";

import { useCounter } from "../(context)/CounterContext";
// import { useEventSource } from "../(context)/EventSourceContext";
import { formatDanishCurrency } from "../(utils)/formatters";
import { useCountAnimation } from "../(utils)/useCountAnimation";
import { useEffect, useState } from "react";

export default function CounterPage() {
  const { count } = useCounter();
  // const { isConnected } = useEventSource();
  const [mounted, setMounted] = useState(false);
  const animatedCount = useCountAnimation(count, 1200, 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-slate-100 p-4">
      <div className="text-center relative">
        {/* <div className="absolute top-2 right-2 flex items-center">
          <span className="text-xs mr-2 text-gray-600">Netværk:</span>
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
        </div> */}

        <div className="bg-white p-10 rounded-2xl shadow-xl mb-10 border border-blue-100">
          <div className="text-7xl md:text-8xl lg:text-9xl font-bold text-black">
            {formatDanishCurrency(animatedCount)}
          </div>
        </div>
      </div>
    </div>
  );
}
