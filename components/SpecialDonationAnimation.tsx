import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { database } from "../firebase";
import { ref, onValue, set } from "firebase/database";

interface SpecialDonationAnimationProps {
  active: boolean;
  message?: string;
  amount?: number;
  onActiveChange?: (isActive: boolean) => void;
}

export function SpecialDonationAnimation({
  active: propActive,
  message: propMessage,
  amount: propAmount,
  onActiveChange,
}: SpecialDonationAnimationProps) {
  const messageRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState<boolean>(propActive);
  const [message, setMessage] = useState<string | null>(propMessage || null);
  const [amount, setAmount] = useState<number | null>(propAmount || null);

  // Notify parent component when active state changes
  useEffect(() => {
    onActiveChange?.(isActive);
  }, [isActive, onActiveChange]);

  // Listen directly to the special_animation path in Firebase
  useEffect(() => {
    // Use the dedicated special_animation path
    const specialAnimationRef = ref(database, "special_animation");

    const unsubscribe = onValue(specialAnimationRef, (snapshot) => {
      const data = snapshot.val();

      if (data && data.active) {
        setIsActive(true);

        if (data.message) {
          setMessage(data.message);
        }

        if (data.amount !== undefined) {
          try {
            const numAmount = Number(data.amount);
            if (!isNaN(numAmount)) {
              setAmount(numAmount);
            }
          } catch {
            // Silent error handling
          }
        }

        // Automatically reset after 7 seconds
        const timer = setTimeout(() => {
          setIsActive(false);

          // Also clear the flag in Firebase
          set(specialAnimationRef, { active: false });
        }, 5000);

        return () => clearTimeout(timer);
      } else {
        setIsActive(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Override with props if they're provided (for backward compatibility)
  useEffect(() => {
    if (propActive !== undefined) {
      setIsActive(propActive);
    }
    if (propMessage) {
      setMessage(propMessage);
    }
    if (propAmount !== undefined) {
      setAmount(propAmount);
    }
  }, [propActive, propMessage, propAmount]);

  // Animation effect
  useEffect(() => {
    if (isActive && messageRef.current) {
      // Reset position for animation
      gsap.set(messageRef.current, { y: 50, opacity: 0 });

      // Animate in
      gsap.to(messageRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.2,
        ease: "power2.out",
      });
    } else if (!isActive && messageRef.current) {
      // Animate out when no longer active
      gsap.to(messageRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.2,
        ease: "power2.in",
      });
    }
  }, [isActive, message, amount]);

  // Format the amount with dot as decimal separator
  const formatAmount = (value: number | null): string => {
    if (value === null) return "";

    try {
      // Format with Danish locale but replace comma with dot for decimal separator
      return `${value.toLocaleString("da-DK").replace(/,/g, ".")} kr`;
    } catch {
      return `${value} kr`;
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {isActive && (
        <div
          ref={messageRef}
          className="bg-[#FBF5EB] rounded-2xl max-w-[1200px] w-full h-[400px] flex flex-col items-center justify-center"
        >
          <div className="text-center">
            <h2 className="font-bold text-[#D9A84E] text-6xl ">{message}</h2>
            <div className="text-[#D9A84E] text-[10rem] font-bold">
              {formatAmount(amount)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
