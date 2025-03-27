"use client";

import { useEffect, useState } from "react";
import { useCounter } from "../(context)/CounterContext";
import { useCountAnimation } from "../(utils)/useCountAnimation";
import { useSpecialAnimation } from "../(utils)/useSpecialAnimation";
import { AnimatedCounterDisplay } from "../components/AnimatedCounterDisplay";
import { SpecialDonationAnimation } from "../components/SpecialDonationAnimation";
import { FullscreenButton } from "../components/FullscreenButton";
import { FullscreenContainer } from "../components/FullscreenContainer";

export default function CounterPage() {
  const { count } = useCounter();
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const specialDonation = useSpecialAnimation();
  const animatedCount = useCountAnimation(count, 1200, 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 relative">
      <FullscreenButton onFullscreenChange={setIsFullscreen} />
      <FullscreenContainer isFullscreen={isFullscreen}>
        <div className="text-center relative">
          <SpecialDonationAnimation
            active={specialDonation.active}
            message={specialDonation.message}
          />

          <AnimatedCounterDisplay
            count={animatedCount}
            isSpecialActive={specialDonation.active}
          />
        </div>
      </FullscreenContainer>
    </div>
  );
}
