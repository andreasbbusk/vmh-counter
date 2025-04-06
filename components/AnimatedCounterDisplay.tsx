import { formatDanishCurrency } from "../utils/formatters";
import CountUp from "react-countup";

const enhancedSlowEndEasing = (t: number, b: number, c: number, d: number) => {
  const scaledT = t / d;
  return b + c * (1 - Math.pow(1 - scaledT, 15));
};

interface AnimatedCounterDisplayProps {
  count: number;
  isSpecialActive: boolean;
}

export function AnimatedCounterDisplay({ count }: AnimatedCounterDisplayProps) {
  return (
    <div className="transition-all duration-500">
      <div className="text-7xl md:text-8xl lg:text-[10rem] font-bold text-[#e0a619]">
        <CountUp
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
