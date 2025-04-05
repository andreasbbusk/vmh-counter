import { useAutoAnimate } from "@formkit/auto-animate/react";
import Image from "next/image";

interface SpecialDonationAnimationProps {
  active: boolean;
  message?: string;
}

export function SpecialDonationAnimation({
  active,
  message,
}: SpecialDonationAnimationProps) {
  const [parent] = useAutoAnimate({
    duration: 1000,
    easing: "ease-in-out",
  });

  return (
    <div ref={parent} className="absolute -top-24 left-1/2">
      {active && (
        <div className="transform -translate-x-1/2 bg-[#FBF5EB] text-[#e0a619] p-4 rounded-lg shadow-md mb-4">
          <div className="flex flex-col items-center">
            <div className="flex flex-row items-center gap-4">
              <Image
                src="/hands.png"
                alt="Donation hands"
                width={50}
                height={50}
                className=""
              />
              <h3 className="font-semibold text-2xl mb-1">{message}</h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
