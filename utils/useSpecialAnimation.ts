import { useState, useEffect } from "react";
import { database } from "../firebase";
import { ref, onValue, set } from "firebase/database";

interface SpecialDonationState {
  message?: string;
  amount?: number;
  active: boolean;
}

/**
 * Custom hook for handling special donation animations
 * @returns The current special donation state with message and active status
 */
export function useSpecialAnimation(): SpecialDonationState {
  const [specialDonation, setSpecialDonation] = useState<SpecialDonationState>({
    active: false,
  });

  // Monitor for special animations using the dedicated path
  useEffect(() => {
    // Use the dedicated special_animation path
    const specialAnimationRef = ref(database, "special_animation");

    const unsubscribe = onValue(specialAnimationRef, (snapshot) => {
      const data = snapshot.val();

      if (data && data.active) {
        // Extract and validate the amount
        let amount: number | undefined = undefined;

        if (data.amount !== undefined) {
          // Convert to number and validate
          amount = Number(data.amount);
          if (isNaN(amount)) {
            amount = undefined;
          }
        }

        // Update the state with the special donation data
        setSpecialDonation({
          message: data.message,
          amount: amount,
          active: true,
        });

        // Auto-reset after timeout (this is also handled in the component, but keeping for redundancy)
        const timer = setTimeout(() => {
          setSpecialDonation({ active: false });

          // Reset the active flag in Firebase
          set(specialAnimationRef, { active: false });
        }, 7000);

        return () => clearTimeout(timer);
      } else {
        // No active animation or data cleared
        if (specialDonation.active) {
          setSpecialDonation({ active: false });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return specialDonation;
}
