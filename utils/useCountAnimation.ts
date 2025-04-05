import { useEffect, useState } from "react";

// Collection of easing functions for different animation styles
const easingFunctions = {
  // Default - slows down toward the end
  easeOutExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),

  // More dramatic slowdown at the end (even stronger than easeOutExpo)
  easeOutQuart: (t: number) => 1 - Math.pow(1 - t, 4),

  // Very pronounced slowdown at the end
  easeOutBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },

  // Custom easing with extremely strong deceleration
  customSlowEnd: (t: number) => {
    // Combination of functions for extra strong end slowdown
    if (t < 0.5) {
      // Start with a moderate acceleration
      return 2 * t * t;
    } else {
      // End with a very strong deceleration
      return 1 - Math.pow(2 * (1 - t), 5);
    }
  },
};

/**
 * Custom hook for animating a count from one value to another
 * @param targetValue The target value to animate to
 * @param duration The duration of the animation in milliseconds
 * @param delay The delay before starting the animation in milliseconds
 * @returns The current animated value
 */
export function useCountAnimation(
  targetValue: number,
  duration: number = 1500, // Increased default duration
  delay: number = 0
): number {
  const [animatedValue, setAnimatedValue] = useState(targetValue);
  const [previousValue, setPreviousValue] = useState(targetValue);

  useEffect(() => {
    // Skip animation for initial render or for small changes
    if (
      targetValue === previousValue ||
      Math.abs(targetValue - previousValue) < 10
    ) {
      setAnimatedValue(targetValue);
      setPreviousValue(targetValue);
      return;
    }

    let startTime: number | null = null;
    let animationFrameId: number;
    const timeoutId: NodeJS.Timeout = setTimeout(() => {
      animationFrameId = requestAnimationFrame(animateValue);
    }, delay);

    // Function to animate the value
    const animateValue = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsedTime = timestamp - startTime;

      if (elapsedTime < duration) {
        // Calculate the progress from 0 to 1
        const progress = elapsedTime / duration;
        // Apply custom easing function for stronger slowdown at the end
        const easedProgress = easingFunctions.customSlowEnd(progress);

        // Calculate the current value based on progress
        const currentValue =
          previousValue + (targetValue - previousValue) * easedProgress;
        setAnimatedValue(Math.round(currentValue));

        // Continue animation
        animationFrameId = requestAnimationFrame(animateValue);
      } else {
        // Animation complete
        setAnimatedValue(targetValue);
        setPreviousValue(targetValue);
      }
    };

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(animationFrameId);
    };
  }, [targetValue, duration, delay, previousValue]);

  return animatedValue;
}
