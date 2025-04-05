import { ReactNode } from "react";
import { motion } from "framer-motion";

interface FullscreenContainerProps {
  children: ReactNode;
  isFullscreen: boolean;
}

export function FullscreenContainer({
  children,
  isFullscreen,
}: FullscreenContainerProps) {
  return (
    <motion.div
      className={`w-full transition-all duration-700 ${
        isFullscreen ? "scale-[1]" : "scale-100"
      }`}
      animate={{
        scale: isFullscreen ? 1 : 1,
        y: isFullscreen ? 0 : 0,
      }}
      transition={{
        duration: 0.5,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}
