"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { LOGOS } from "../app/logos";

export function LogoSlider() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [logoSetWidth, setLogoSetWidth] = useState(0);

  // Calculate container and logo set widths
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidths = () => {
      // Calculate the width of a single set of logos
      const singleLogoSetWidth = container.scrollWidth / 2;
      setLogoSetWidth(singleLogoSetWidth);
    };

    updateWidths();
    window.addEventListener("resize", updateWidths);

    return () => window.removeEventListener("resize", updateWidths);
  }, []);

  // Scroll the logos continuously
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !logoSetWidth) return;

    const scrollInterval = setInterval(() => {
      if (container) {
        // Create an infinite scroll effect by resetting position when we've scrolled one full set
        if (scrollPosition >= logoSetWidth) {
          // Reset scroll position without animation
          const newPosition = scrollPosition - logoSetWidth;
          setScrollPosition(newPosition);
          container.scrollLeft = newPosition;
        } else {
          // Continue scrolling smoothly
          const newPosition = scrollPosition + 1;
          setScrollPosition(newPosition);
          container.scrollLeft = newPosition;
        }
      }
    }, 20);

    return () => clearInterval(scrollInterval);
  }, [scrollPosition, logoSetWidth]);

  return (
    <div className="w-full py-2 border-y border-[#e0a619]">
      <div
        ref={containerRef}
        className="flex items-center overflow-hidden whitespace-nowrap"
      >
        {/* First set of logos */}
        {LOGOS.map((logo) => (
          <div
            key={logo.id}
            className="flex-none h-28 sm:h-36 md:h-40 min-w-[220px] sm:min-w-[260px] md:min-w-[300px]"
          >
            <div className="flex items-center justify-center h-full">
              <div className="relative h-24 sm:h-32 md:h-36 w-full">
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
