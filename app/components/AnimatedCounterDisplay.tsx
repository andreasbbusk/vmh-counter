import {
  motion,
  cubicBezier,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import { formatDanishCurrency } from "../(utils)/formatters";
import { useEffect } from "react";

// Custom easing function with stronger deceleration at the end
const customEasing = cubicBezier(0.25, 0.1, 0.25, 0.7);

// Alternative custom easing function - extremely slow end
const extremeSlowEndEasing = {
  type: "tween",
  ease: (t: number) => {
    // Start reasonably fast, then dramatically slow down
    return 1 - Math.pow(1 - t, 15);
  },
};

interface AnimatedCounterDisplayProps {
  count: number;
  isSpecialActive: boolean;
}

export function AnimatedCounterDisplay({
  count,
  isSpecialActive,
}: AnimatedCounterDisplayProps) {
  // Use Framer Motion's animation system
  const countValue = useMotionValue(count);
  const roundedCount = useTransform(countValue, Math.round);

  useEffect(() => {
    // Animate the count value when it changes
    const animation = animate(countValue, count, {
      duration: 7,
      ease: extremeSlowEndEasing.ease,
    });

    return animation.stop;
  }, [count, countValue]);

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
                transition: {
                  duration: 12,
                  ease: customEasing,
                  times: [0, 0.4, 1], // Spend more time in the final phase
                },
              }
            : {}
        }
        className="text-7xl md:text-8xl lg:text-9xl lg:text-[10rem] font-bold text-[#e0a619]"
      >
        {useTransform(roundedCount, (value) => formatDanishCurrency(value))}
      </motion.div>
    </div>
  );
}
