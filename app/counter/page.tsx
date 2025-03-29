"use client";

import { useEffect, useState } from "react";
import { useCounter } from "../(context)/CounterContext";
import { useCountAnimation } from "../(utils)/useCountAnimation";
import { useSpecialAnimation } from "../(utils)/useSpecialAnimation";
import { AnimatedCounterDisplay } from "../components/AnimatedCounterDisplay";
import { SpecialDonationAnimation } from "../components/SpecialDonationAnimation";
import { FullscreenButton } from "../components/FullscreenButton";
import { FullscreenContainer } from "../components/FullscreenContainer";
import { LogoSlider } from "../components/LogoSlider";
import { Header } from "../components/Header";

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
    <>
      <FullscreenContainer isFullscreen={isFullscreen}>
        <div className="flex flex-col items-center justify-center min-h-screen relative">
          <div className="absolute top-0 left-0 right-0">
            <Header />
          </div>
          <FullscreenButton onFullscreenChange={setIsFullscreen} />

          <div className="flex-1 flex flex-col items-center justify-center p-4 w-full">
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
          </div>

          <div className="absolute bottom-0 left-0 right-0">
            <LogoSlider />
          </div>
        </div>
      </FullscreenContainer>
    </>
  );
}
