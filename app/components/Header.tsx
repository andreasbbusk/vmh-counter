"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  return (
    <header
      className={cn(
        "w-full bg-[#FBF6E5] p-8 py-8 flex justify-between items-center border-[#e0a619]",
        className
      )}
    >
      <div className="flex items-center gap-6">
        <div className="relative w-[120px] h-[120px]">
          <Image
            src="/images/midlertidig.png"
            alt="MobilePay QR Code"
            width={120}
            height={120}
            className="rounded-md"
            priority
          />
        </div>
        <div className="flex flex-col">
          <span className="text-[#e0a619] text-xl font-medium">MobilePay:</span>
          <span className="text-[#e0a619] text-7xl font-bold">56500</span>
        </div>
      </div>
      <div className="flex items-center">
        <Image
          src="/VMH-vertical.svg"
          alt="Vejle Mod Hudcancer Logo"
          width={300}
          height={120}
          priority
        />
      </div>
    </header>
  );
}

export default Header;
