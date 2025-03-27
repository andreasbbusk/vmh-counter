import { useState, useEffect } from "react";
import { database } from "../../firebase";
import { ref, onValue, set } from "firebase/database";

interface SpecialDonationState {
  message?: string;
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

  // Monitor for special animations
  useEffect(() => {
    const counterRef = ref(database, "counter");
    const unsubscribe = onValue(counterRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.specialAnimation) {
        setSpecialDonation({
          message: data.message,
          active: true,
        });

        // Reset the special animation flag after 8 seconds
        setTimeout(() => {
          setSpecialDonation({ active: false });

          // Clear the specialAnimation flag in Firebase
          if (data) {
            const newData = { ...data };
            delete newData.specialAnimation;
            delete newData.message;
            set(ref(database, "counter"), newData);
          }
        }, 8000);
      }
    });

    return () => unsubscribe();
  }, []);

  return specialDonation;
}
