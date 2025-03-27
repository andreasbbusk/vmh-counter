import { motion, AnimatePresence } from "framer-motion";

interface SpecialDonationAnimationProps {
  active: boolean;
  message?: string;
}

export function SpecialDonationAnimation({
  active,
  message,
}: SpecialDonationAnimationProps) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-amber-50 text-[#e0a619] p-3 rounded-lg shadow-lg mb-4 w-full max-w-xs"
        >
          <div className="font-medium text-lg">Speciel Donation!</div>
          {message && <div className="text-sm mt-1">{message}</div>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
