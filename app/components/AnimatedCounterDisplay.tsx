import { motion } from "framer-motion";
import { formatDanishCurrency } from "../(utils)/formatters";

interface AnimatedCounterDisplayProps {
  count: number;
  isSpecialActive: boolean;
}

export function AnimatedCounterDisplay({
  count,
  isSpecialActive,
}: AnimatedCounterDisplayProps) {
  return (
    <div
      className={`transition-all duration-500 ${
        isSpecialActive
          ? "border-amber-300 shadow-amber-200"
          : "border-blue-100"
      }`}
    >
      <motion.div
        animate={
          isSpecialActive
            ? {
                scale: [1, 1.05, 1],
                transition: { duration: 0.5 },
              }
            : {}
        }
        className="text-7xl md:text-8xl lg:text-9xl font-bold text-[#e0a619]"
      >
        {formatDanishCurrency(count)}
      </motion.div>
    </div>
  );
}
