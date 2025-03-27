import { useEffect, useState } from "react";

// Define easing function type
type EasingFunctionType = (t: number) => number;

// Easing function - we're only using this one now
const easeOutExpo: EasingFunctionType = (t) =>
  t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

/**
 * Custom hook for animating a count from one value to another
 * @param targetValue The target value to animate to
 * @param duration The duration of the animation in milliseconds
 * @param delay The delay before starting the animation in milliseconds
 * @returns The current animated value
 */
export function useCountAnimation(
  targetValue: number,
  duration: number = 1000,
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
        // Apply easing function for smoother animation
        const easedProgress = easeOutExpo(progress);

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
