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
  const [isInitialRender, setIsInitialRender] = useState(true);

  // Handle initial render to prevent flicker
  useEffect(() => {
    // Set a very short timeout to handle the initial render
    // This prevents the counter from showing before special animation is evaluated
    const initialTimer = setTimeout(() => {
      setIsInitialRender(false);
    }, 10);

    return () => clearTimeout(initialTimer);
  }, []);

  // Restart the animation when a special animation ends
  useEffect(() => {
    if (!isSpecialActive) {
      // Force a re-render of the CountUp component when special animation ends
      setKey((prev) => prev + 1);
    }
  }, [isSpecialActive]);

  // During initial render or when special is active, hide completely
  if (isInitialRender || isSpecialActive) {
    return (
      <div className="opacity-0 transition-all duration-500">
        <div className="text-7xl md:text-8xl lg:text-[10rem] font-bold text-[#e0a619]">
          {formatDanishCurrency(count)}
        </div>
      </div>
    );
  }

  return (
    <div className="opacity-100 transition-all duration-500">
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
