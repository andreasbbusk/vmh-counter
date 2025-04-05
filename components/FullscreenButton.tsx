import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Maximize2, Minimize2 } from "lucide-react";

interface FullscreenButtonProps {
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

export function FullscreenButton({
  onFullscreenChange,
}: FullscreenButtonProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const newFullscreenState = !!document.fullscreenElement;
      setIsFullscreen(newFullscreenState);
      if (onFullscreenChange) {
        onFullscreenChange(newFullscreenState);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F11") {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onFullscreenChange]);

  return (
    <motion.button
      onClick={toggleFullscreen}
      className="absolute bottom-3 right-3 p-2 bg-white/60 hover:bg-white/90 rounded-full text-gray-700 z-10 transition-all"
      whileTap={{ scale: 0.95 }}
      title={isFullscreen ? "Exit fullscreen (F11)" : "Enter fullscreen (F11)"}
    >
      {isFullscreen ? <Minimize2 size={0} /> : <Maximize2 size={20} />}
    </motion.button>
  );
}
