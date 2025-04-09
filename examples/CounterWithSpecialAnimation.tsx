import { useState } from "react";
import { SpecialDonationAnimation } from "../components/SpecialDonationAnimation";
import { AnimatedCounterDisplay } from "../components/AnimatedCounterDisplay";

export function CounterWithSpecialAnimation() {
  const [isSpecialActive, setIsSpecialActive] = useState(false);
  const [totalAmount, setTotalAmount] = useState(150000);

  // This function would be connected to your data source in the real implementation
  const handleSpecialActiveChange = (active: boolean) => {
    setIsSpecialActive(active);
  };

  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center">
      {/* The regular counter that will be hidden during special animation */}
      <AnimatedCounterDisplay
        count={totalAmount}
        isSpecialActive={isSpecialActive}
      />

      {/* The special donation animation (overlays the counter when active) */}
      <SpecialDonationAnimation
        active={false} // This will be controlled by Firebase in production
        onActiveChange={handleSpecialActiveChange}
      />
    </div>
  );
}
