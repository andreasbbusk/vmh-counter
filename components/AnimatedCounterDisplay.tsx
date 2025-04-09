import { formatDanishCurrency } from "../utils/formatters";
import CountUp from "react-countup";
import { useEffect, useState } from "react";

const enhancedSlowEndEasing = (t: number, b: number, c: number, d: number) => {
  const scaledT = t / d;
  return b + c * (1 - Math.pow(1 - scaledT, 15));
};

interface AnimatedCounterDisplayProps {
  count: number;
  isSpecialActive: boolean;
}

export function AnimatedCounterDisplay({
  count,
  isSpecialActive,
}: AnimatedCounterDisplayProps) {
  const [key, setKey] = useState(0);

  // Restart the animation when a special animation ends
  useEffect(() => {
    if (!isSpecialActive) {
      // Force a re-render of the CountUp component when special animation ends
      setKey((prev) => prev + 1);
    }
  }, [isSpecialActive]);

  return (
    <div
      className={`transition-all duration-500 ${
        isSpecialActive ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="text-7xl md:text-8xl lg:text-[10rem] font-bold text-[#e0a619]">
        <CountUp
          key={key}
          end={count}
          duration={8}
          decimals={0}
          decimal=","
          separator="."
          formattingFn={formatDanishCurrency}
          useEasing={true}
          easingFn={enhancedSlowEndEasing}
          preserveValue={true}
        />
      </div>
    </div>
  );
}
