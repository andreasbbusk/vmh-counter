import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";

interface SpecialDonationAnimationProps {
  active: boolean;
  message?: string;
  amount?: number;
}

export function SpecialDonationAnimation({
  active,
  message,
}: SpecialDonationAnimationProps) {
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (active && messageRef.current) {
      // Reset position for animation
      gsap.set(messageRef.current, { y: 50, opacity: 0 });

      // Animate in
      gsap.to(messageRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.2,
        ease: "power2.out",
      });
    } else if (!active && messageRef.current) {
      // Animate out when no longer active
      gsap.to(messageRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.4,
        ease: "power2.in",
      });
    }
  }, [active]);

  return (
    <div className="absolute -top-40 left-1/2 transform -translate-x-1/2">
      {active && (
        <div
          ref={messageRef}
          className="bg-[#FBF5EB] border-1 border-[#e0a619] text-[#e0a619] min-w-[600px] p-8 py-10 rounded-lg mb-4"
        >
          <div className="">
            <div className="flex flex-row items-center justify-center gap-6">
              <Image
                src="/hands.png"
                alt="Donation hands"
                width={70}
                height={70}
                className=""
              />
              <div className="flex flex-col">
                <h3 className="font-medium text-3xl">{message}</h3>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
