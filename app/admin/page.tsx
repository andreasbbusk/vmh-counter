"use client";

import { useState, useRef, useEffect } from "react";
import { useCounter } from "../(context)/CounterContext";
import { formatDanishCurrency } from "../(utils)/formatters";
import Link from "next/link";
import { database } from "../../firebase";
import { ref, onValue, push, get } from "firebase/database";

interface CounterData {
  value: number;
  updatedAt: string;
}

interface HistoryEntry {
  value: number;
  updatedAt: string;
  key: string;
}

export default function AdminPage() {
  const { count, setCount } = useCounter();
  const [isConnected, setIsConnected] = useState(false);
  const [inputValue, setInputValue] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const lastSubmitTime = useRef(0);

  // Monitor Firebase connection status
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const connectedRef = ref(database, ".info/connected");
      const unsubscribe = onValue(connectedRef, (snap) => {
        setIsConnected(!!snap.val());
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error monitoring connection status:", error);
      setIsConnected(false);
      return () => {};
    }
  }, []);

  useEffect(() => {
    const counterRef = ref(database, "counter");
    const unsubscribe = onValue(counterRef, (snapshot) => {
      const data = snapshot.val() as CounterData | null;
      if (data && data.updatedAt) {
        setLastUpdated(data.updatedAt);
      }
    });

    // Load history entries
    const historyRef = ref(database, "counter_history");
    get(historyRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const entries: HistoryEntry[] = [];

        // Convert object to array and sort by date (newest first)
        Object.keys(data).forEach((key) => {
          entries.push({
            ...data[key],
            key,
          });
        });

        entries.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        setHistoryEntries(entries.slice(0, 10)); // Show only the last 10 entries
      }
    });

    return () => unsubscribe();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("da-DK", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

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

      // Add entry to history before updating counter
      const currentDate = new Date().toISOString();
      const historyRef = ref(database, "counter_history");
      push(historyRef, {
        value: numValue,
        updatedAt: currentDate,
        previousValue: count,
      });

      setCount(numValue);
      setInputValue("");
      setSuccess(true);

      // Update local history state
      const newEntry: HistoryEntry = {
        value: numValue,
        updatedAt: currentDate,
        key: Date.now().toString(), // Temporary key until refresh
      };
      setHistoryEntries((prev) => [newEntry, ...prev.slice(0, 9)]);

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
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-1">
              Sidst opdateret: {formatDate(lastUpdated)}
            </p>
          )}
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

        <div className="mt-6">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-blue-600 hover:underline text-sm mb-2 flex items-center"
          >
            {showHistory ? "Skjul historik" : "Vis opdateringshistorik"}
            <svg
              className={`ml-1 w-4 h-4 transform ${
                showHistory ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showHistory && (
            <div className="border rounded-md mt-2 overflow-hidden">
              {historyEntries.length > 0 ? (
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-2 px-3 text-left font-medium text-gray-500">
                          Værdi
                        </th>
                        <th className="py-2 px-3 text-left font-medium text-gray-500">
                          Dato
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {historyEntries.map((entry) => (
                        <tr key={entry.key} className="hover:bg-gray-50">
                          <td className="py-2 px-3">
                            {formatDanishCurrency(entry.value)}
                          </td>
                          <td className="py-2 px-3">
                            {formatDate(entry.updatedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-4 text-gray-500">
                  Ingen historik endnu
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <Link href="/counter" className="text-blue-600 hover:underline">
            Se tæller
          </Link>
        </div>
      </div>
    </div>
  );
}
