"use client";

import { useState, useRef } from "react";
import { useCounter } from "../(context)/CounterContext";
import { useEventSource } from "../(context)/EventSourceContext";
import { formatDanishCurrency } from "../(utils)/formatters";
import Link from "next/link";

export default function AdminPage() {
  const { count, setCount } = useCounter();
  const { isConnected } = useEventSource();
  const [inputValue, setInputValue] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastSubmitTime = useRef(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent rapid form submissions
    const now = Date.now();
    if (now - lastSubmitTime.current < 1000 || isSubmitting) {
      return;
    }

    setError("");
    setSuccess(false);
    setIsSubmitting(true);
    lastSubmitTime.current = now;

    // Remove all non-numeric characters except commas and dots
    const sanitizedValue = inputValue.replace(/[^\d,.]/g, "");

    if (!sanitizedValue) {
      setError("Indtast venligst et gyldigt tal");
      setIsSubmitting(false);
      return;
    }

    try {
      // Replace dots (thousand separators) and convert comma to dot for decimal point
      const numericString = sanitizedValue.replace(/\./g, "").replace(",", ".");
      const numValue = Number(numericString);

      if (isNaN(numValue)) {
        setError("Ugyldigt talformat");
        setIsSubmitting(false);
        return;
      }

      setCount(numValue);
      setInputValue("");
      setSuccess(true);

      // Reset submission status after a delay
      setTimeout(() => {
        setIsSubmitting(false);
      }, 1000);
    } catch (error) {
      console.error("Error processing number:", error);
      setError("Kunne ikke behandle tallet");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 text-black">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-center">
            Administrationspanel
          </h1>
          <div className="flex items-center">
            <span className="text-xs mr-2">Netværk:</span>
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm mb-2">Nuværende værdi:</p>
          <p className="text-xl font-bold">{formatDanishCurrency(count)}</p>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-2 bg-green-100 text-green-700 rounded-md">
            Tæller opdateret
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="counterValue"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Opdater tællerværdi
            </label>
            <input
              id="counterValue"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Indtast ny værdi (f.eks. 4.000.000)"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            />
          </div>
          <button
            type="submit"
            className={`w-full ${
              isSubmitting ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            } text-white py-2 px-4 rounded-md transition-colors`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Opdaterer..." : "Opdater Tæller"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/counter" className="text-blue-600 hover:underline">
            Se tæller
          </Link>
        </div>
      </div>
    </div>
  );
}
