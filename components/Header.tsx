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
        "w-full p-8 py-4 flex justify-between items-center border-[#e0a619]",
        className
      )}
    >
      <div className="flex items-center">
        <Image
          src="/VMH-vertical.svg"
          alt="Vejle Mod Hudcancer Logo"
          width={200}
          height={80}
          priority
        />
      </div>
      <div className="flex items-center gap-4">
        <div className="relative w-[80px] h-[80px]">
          <Image
            src="/images/midlertidig.png"
            alt="MobilePay QR Code"
            width={80}
            height={80}
            className="rounded-md"
            priority
          />
        </div>
        <div className="flex flex-col">
          {/* <span className="text-[#e0a619] text-lg font-medium">MobilePay:</span> */}
          <span className="text-[#e0a619] text-5xl font-bold">56500</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
