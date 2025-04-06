"use client";

import { useState, useRef, useEffect } from "react";
import { useCounter } from "../../context/CounterContext";
import { formatDanishCurrency } from "../../utils/formatters";
import { database } from "../../firebase";
import { ref, onValue, push, get, set, remove } from "firebase/database";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2, Undo } from "lucide-react";

interface CounterData {
  value: number;
  updatedAt: string;
  message?: string;
  amount?: number;
  specialAnimation?: boolean;
}

interface HistoryEntry {
  value: number;
  updatedAt: string;
  key: string;
  type?: string;
  addedAmount?: number;
  previousValue?: number;
  message?: string;
  amount?: number;
  specialAnimation?: boolean;
}

// Rollback action component
const RollbackAction = ({
  entry,
  onRollback,
  disabled,
}: {
  entry: HistoryEntry;
  onRollback: (entry: HistoryEntry) => void;
  disabled: boolean;
}) => {
  if (!entry.previousValue && entry.type !== "reset") {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onRollback(entry)}
            disabled={disabled}
          >
            <Undo className="h-3.5 w-3.5" />
            <span className="sr-only">Fortryd ændring</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            Fjern denne handling og rul tilbage til{" "}
            {formatDanishCurrency(entry.previousValue || 0)}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default function AdminPage() {
  const { count, setCount } = useCounter();
  const [inputValue, setInputValue] = useState<string>("");
  const [addValue, setAddValue] = useState<string>("");
  const [specialValue, setSpecialValue] = useState<string>("");
  const [specialMessage, setSpecialMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [isRollbackDialogOpen, setIsRollbackDialogOpen] = useState(false);
  const [rollbackEntry, setRollbackEntry] = useState<HistoryEntry | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const lastSubmitTime = useRef(0);

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
    setIsLoadingHistory(true);
    get(historyRef)
      .then((snapshot) => {
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
          setHistoryEntries(entries.slice(0, 20)); // Show more entries
        }
        setIsLoadingHistory(false);
      })
      .catch((error) => {
        console.error("Error loading history:", error);
        setIsLoadingHistory(false);
      });

    return () => unsubscribe();
  }, []);

  // Format input with thousands separators during typing
  const formatInputValue = (value: string): string => {
    // Remove all non-digit characters except the last comma/dot for decimal
    const cleanValue = value.replace(/[^\d,.]/g, "");

    if (!cleanValue) return "";

    // Check if there's a decimal part
    const parts = cleanValue.split(/[,.]/);
    if (parts.length <= 1) {
      // No decimal, format with thousand separators
      return Number(parts[0]).toLocaleString("da-DK");
    } else {
      // Has decimal part, preserve it
      const integerPart = Number(parts[0]).toLocaleString("da-DK");
      return `${integerPart},${parts[1]}`;
    }
  };

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

      // Update Firebase first
      const counterRef = ref(database, "counter");
      set(counterRef, {
        value: numValue,
        updatedAt: currentDate,
      })
        .then(() => {
          // Then add to history after counter is updated
          return push(historyRef, {
            value: numValue,
            updatedAt: currentDate,
            previousValue: count,
            type: "set",
          });
        })
        .then(() => {
          // After both operations succeed, update local state
          setCount(numValue);
          setInputValue("");

          // Update local history state
          const newEntry: HistoryEntry = {
            value: numValue,
            updatedAt: currentDate,
            key: Date.now().toString(), // Temporary key until refresh
            type: "set",
            previousValue: count,
          };
          setHistoryEntries((prev) => [newEntry, ...prev.slice(0, 19)]);

          // Reset submission status after a delay
          setTimeout(() => {
            setIsSubmitting(false);
          }, 1000);
        })
        .catch((error) => {
          console.error("Error updating counter:", error);
          setError(
            "Kunne ikke opdatere tælleren. Tjek din internetforbindelse."
          );
          setIsSubmitting(false);
        });
    } catch (error) {
      console.error("Error processing number:", error);
      setError("Kunne ikke behandle tallet");
      setIsSubmitting(false);
    }
  };

  const handleAddToTotal = (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent rapid form submissions
    const now = Date.now();
    if (now - lastSubmitTime.current < 1000 || isSubmitting) {
      return;
    }

    setError("");
    setIsSubmitting(true);
    lastSubmitTime.current = now;

    // Remove all non-numeric characters except commas and dots
    const sanitizedValue = addValue.replace(/[^\d,.]/g, "");

    if (!sanitizedValue) {
      setError("Indtast venligst et gyldigt tal");
      setIsSubmitting(false);
      return;
    }

    try {
      // Replace dots (thousand separators) and convert comma to dot for decimal point
      const numericString = sanitizedValue.replace(/\./g, "").replace(",", ".");
      const addAmount = Number(numericString);

      if (isNaN(addAmount)) {
        setError("Ugyldigt talformat");
        setIsSubmitting(false);
        return;
      }

      if (addAmount <= 0) {
        setError("Beløbet skal være større end 0");
        setIsSubmitting(false);
        return;
      }

      const newTotal = count + addAmount;
      const currentDate = new Date().toISOString();

      // Update Firebase counter first
      const counterRef = ref(database, "counter");
      set(counterRef, {
        value: newTotal,
        updatedAt: currentDate,
      })
        .then(() => {
          // Then add to history
          const historyRef = ref(database, "counter_history");
          return push(historyRef, {
            value: newTotal,
            updatedAt: currentDate,
            previousValue: count,
            addedAmount: addAmount,
            type: "add",
          });
        })
        .then(() => {
          // Update local state after both operations succeed
          setCount(newTotal);
          setAddValue("");

          // Update local history state
          const newEntry: HistoryEntry = {
            value: newTotal,
            updatedAt: currentDate,
            key: Date.now().toString(), // Temporary key until refresh
            type: "add",
            previousValue: count,
            addedAmount: addAmount,
          };
          setHistoryEntries((prev) => [newEntry, ...prev.slice(0, 19)]);

          // Reset submission status after a delay
          setTimeout(() => {
            setIsSubmitting(false);
          }, 1000);
        })
        .catch((error) => {
          console.error("Error adding to counter:", error);
          setError(
            "Kunne ikke tilføje til tælleren. Tjek din internetforbindelse."
          );
          setIsSubmitting(false);
        });
    } catch (error) {
      console.error("Error processing number:", error);
      setError("Kunne ikke behandle tallet");
      setIsSubmitting(false);
    }
  };

  const handleSpecialDonation = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent rapid form submissions
    const now = Date.now();
    if (now - lastSubmitTime.current < 1000 || isSubmitting) {
      return;
    }

    setError("");
    setIsSubmitting(true);
    lastSubmitTime.current = now;

    // Remove all non-numeric characters except commas and dots
    const sanitizedValue = specialValue.replace(/[^\d,.]/g, "");

    if (!sanitizedValue) {
      setError("Indtast venligst et gyldigt tal");
      setIsSubmitting(false);
      return;
    }

    try {
      // Replace dots (thousand separators) and convert comma to dot for decimal point
      const numericString = sanitizedValue.replace(/\./g, "").replace(",", ".");
      const addAmount = Number(numericString);

      if (isNaN(addAmount)) {
        setError("Ugyldigt talformat");
        setIsSubmitting(false);
        return;
      }

      if (addAmount <= 0) {
        setError("Beløbet skal være større end 0");
        setIsSubmitting(false);
        return;
      }

      const newTotal = count + addAmount;
      const message = specialMessage.trim();

      // Update Firebase counter with special animation flag
      const currentDate = new Date().toISOString();
      const counterRef = ref(database, "counter");

      try {
        await set(counterRef, {
          value: newTotal,
          updatedAt: currentDate,
          message: message || undefined,
          amount: addAmount,
          specialAnimation: true,
        });

        // Add entry to history after counter is updated
        const historyRef = ref(database, "counter_history");
        await push(historyRef, {
          value: newTotal,
          updatedAt: currentDate,
          previousValue: count,
          addedAmount: addAmount,
          type: "special",
          message: message || undefined,
          amount: addAmount,
          specialAnimation: true,
        });

        // Update local state
        setCount(newTotal);
        setSpecialValue("");
        setSpecialMessage("");

        // Update local history state
        const newEntry: HistoryEntry = {
          value: newTotal,
          updatedAt: currentDate,
          key: Date.now().toString(), // Temporary key until refresh
          type: "special",
          previousValue: count,
          addedAmount: addAmount,
          message: message || undefined,
          amount: addAmount,
          specialAnimation: true,
        };
        setHistoryEntries((prev) => [newEntry, ...prev.slice(0, 19)]);

        // Reset submission status after a delay
        setTimeout(() => {
          setIsSubmitting(false);
        }, 1000);
      } catch (error) {
        console.error("Error updating Firebase:", error);
        setError("Kunne ikke gemme donationen. Tjek din internetforbindelse.");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error processing special donation:", error);
      setError("Kunne ikke behandle donationen");
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    // Prevent rapid form submissions
    const now = Date.now();
    if (now - lastSubmitTime.current < 1000 || isSubmitting) {
      return;
    }

    setError("");
    setIsSubmitting(true);
    lastSubmitTime.current = now;

    try {
      // Reset the counter in Firebase
      const currentDate = new Date().toISOString();

      // First update the counter to 0
      await set(ref(database, "counter"), {
        value: 0,
        updatedAt: currentDate,
      });

      // Then delete all history data
      await set(ref(database, "counter_history"), null);

      // Update local state
      setCount(0);

      // Clear local history state
      setHistoryEntries([]);

      // Reset submission status after a delay
      setTimeout(() => {
        setIsSubmitting(false);
      }, 1000);
    } catch (error) {
      console.error("Error resetting counter:", error);
      setError("Kunne ikke nulstille tælleren. Tjek din internetforbindelse.");
      setIsSubmitting(false);
    }
  };

  // Initiate rollback from an entry
  const initiateRollback = (entry: HistoryEntry) => {
    if (isSubmitting) return;

    setRollbackEntry(entry);
    setIsRollbackDialogOpen(true);
  };

  // Perform rollback to a previous value
  const handleRollback = async () => {
    if (!rollbackEntry || !rollbackEntry.previousValue) return;

    setError("");
    setIsSubmitting(true);

    try {
      const previousValue = rollbackEntry.previousValue;
      const currentDate = new Date().toISOString();

      // Update Firebase counter value to previous value
      await set(ref(database, "counter"), {
        value: previousValue,
        updatedAt: currentDate,
      });

      // Delete the specific entry from history
      await remove(ref(database, `counter_history/${rollbackEntry.key}`));

      // Update local state
      setCount(previousValue);

      // Remove entry from local history
      setHistoryEntries((prev) =>
        prev.filter((item) => item.key !== rollbackEntry.key)
      );

      // Close the dialog
      setIsRollbackDialogOpen(false);
      setRollbackEntry(null);

      // Reset submission status after a delay
      setTimeout(() => {
        setIsSubmitting(false);
      }, 1000);
    } catch (error) {
      console.error("Error rolling back:", error);
      setError("Kunne ikke rulle ændringen tilbage. Prøv igen.");
      setIsSubmitting(false);
    }
  };

  // Get history entry type badge color
  const getHistoryTypeBadge = (entry: HistoryEntry) => {
    if (!entry.type) return null;

    switch (entry.type) {
      case "set":
        return (
          <Badge variant="outline" className="bg-blue-50">
            Ændret
          </Badge>
        );
      case "add":
        return (
          <Badge variant="outline" className="bg-green-50">
            Tilføjet
          </Badge>
        );
      case "special":
        return (
          <Badge variant="outline" className="bg-amber-50">
            Special
          </Badge>
        );
      case "reset":
        return (
          <Badge variant="outline" className="bg-red-50">
            Nulstillet
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4 text-black">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="space-y-1 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-xl sm:text-2xl">
              Vejle mod hudcancer
            </CardTitle>
          </div>
          <CardDescription className="text-sm">
            Styr, opdater og nulstil VMH-tælleren
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 px-4 py-0 sm:px-6 sm:py-0">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm animate-pulse">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-slate-50 rounded-lg">
            <div>
              <div className="text-sm font-medium text-slate-500">
                Nuværende værdi
              </div>
              <div className="text-2xl sm:text-3xl font-bold mt-1 break-all">
                {formatDanishCurrency(count)}
              </div>
            </div>
            <div className="text-left sm:text-right mt-2 sm:mt-0">
              {lastUpdated && (
                <div className="text-xs text-slate-500">
                  Opdateret: {formatDate(lastUpdated)}
                </div>
              )}
            </div>
          </div>

          <Tabs defaultValue="set" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4 w-full">
              <TabsTrigger value="set">Fast værdi</TabsTrigger>
              <TabsTrigger value="add">Tilføj værdi</TabsTrigger>
              <TabsTrigger value="special">Speciel</TabsTrigger>
            </TabsList>

            <TabsContent value="set" className="space-y-4 mt-0">
              <form onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label htmlFor="counterValue" className="text-sm font-medium">
                    Opdater tællerværdi
                  </label>
                  <Input
                    id="counterValue"
                    type="text"
                    inputMode="decimal"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onBlur={(e) =>
                      setInputValue(formatInputValue(e.target.value))
                    }
                    placeholder="Helt ny værdi"
                    className="w-full"
                    disabled={isSubmitting}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full mt-4"
                  disabled={isSubmitting || !inputValue}
                  variant="default"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Opdaterer...
                    </>
                  ) : (
                    "Opdater Tæller"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="add" className="space-y-4 mt-0">
              <form onSubmit={handleAddToTotal}>
                <div className="space-y-2">
                  <label htmlFor="addToCounter" className="text-sm font-medium">
                    Tilføj til nuværende værdi
                  </label>
                  <Input
                    id="addToCounter"
                    type="text"
                    inputMode="decimal"
                    value={addValue}
                    onChange={(e) => setAddValue(e.target.value)}
                    onBlur={(e) =>
                      setAddValue(formatInputValue(e.target.value))
                    }
                    placeholder="Tillæg værdi"
                    className="w-full"
                    disabled={isSubmitting}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full mt-4"
                  disabled={isSubmitting || !addValue}
                  variant="default"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Tilføjer...
                    </>
                  ) : (
                    "Tilføj til Tæller"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="special" className="space-y-4 mt-0">
              <form onSubmit={handleSpecialDonation}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="specialDonation"
                      className="text-sm font-medium"
                    >
                      Speciel donation (værdi)
                    </label>
                    <Input
                      id="specialDonation"
                      type="text"
                      inputMode="decimal"
                      value={specialValue}
                      onChange={(e) => setSpecialValue(e.target.value)}
                      onBlur={(e) =>
                        setSpecialValue(formatInputValue(e.target.value))
                      }
                      placeholder="Donationsbeløb"
                      className="w-full"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="specialMessage"
                      className="text-sm font-medium"
                    >
                      Besked
                    </label>
                    <Input
                      id="specialMessage"
                      type="text"
                      value={specialMessage}
                      onChange={(e) => setSpecialMessage(e.target.value)}
                      placeholder="Besked til visning"
                      className="w-full"
                      disabled={isSubmitting}
                      maxLength={100}
                    />
                    {specialMessage && (
                      <div className="text-xs text-slate-500 text-right">
                        {specialMessage.length}/100 tegn
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full mt-4"
                  disabled={isSubmitting || !specialValue}
                  variant="default"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Tilføjer...
                    </>
                  ) : (
                    "Tilføj Speciel Donation"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 pb-2">
            <div className="mb-3">
              <h3 className="text-base sm:text-lg font-medium">Historik</h3>
              <p className="text-xs sm:text-sm text-gray-500">
                Seneste opdateringer af tælleren
              </p>
            </div>

            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8 text-gray-500 border rounded-md">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                <span>Indlæser historik...</span>
              </div>
            ) : historyEntries.length > 0 ? (
              <div className="border rounded-md overflow-hidden max-h-48 sm:max-h-64 overflow-y-auto">
                <div className="min-w-full overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="bg-slate-100 sticky top-0 z-10">
                      <tr>
                        <th className="py-2 px-2 sm:px-3 text-left font-medium text-gray-500">
                          Type
                        </th>
                        <th className="py-2 px-2 sm:px-3 text-left font-medium text-gray-500">
                          Værdi
                        </th>
                        <th className="py-2 px-2 sm:px-3 text-left font-medium text-gray-500 whitespace-nowrap">
                          Dato
                        </th>
                        <th className="py-2 px-2 sm:px-3 text-center font-medium text-gray-500">
                          Handling
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {historyEntries.map((entry) => (
                        <tr key={entry.key} className="hover:bg-slate-50">
                          <td className="py-2 px-2 sm:px-3 whitespace-nowrap">
                            {getHistoryTypeBadge(entry)}
                          </td>
                          <td className="py-2 px-2 sm:px-3 break-all">
                            {formatDanishCurrency(entry.value)}
                            {(entry.type === "add" ||
                              entry.type === "special") &&
                              entry.addedAmount && (
                                <span
                                  className={`text-xs ml-1 block sm:inline whitespace-nowrap ${
                                    entry.type === "special"
                                      ? "text-amber-600"
                                      : "text-green-600"
                                  }`}
                                >
                                  (+{formatDanishCurrency(entry.addedAmount)})
                                </span>
                              )}
                            {entry.type === "special" && entry.message && (
                              <span className="text-xs text-gray-500 block mt-1">
                                &ldquo;{entry.message}&rdquo;
                                {entry.amount && (
                                  <span className="font-medium block mt-0.5">
                                    {formatDanishCurrency(entry.amount)} kr
                                  </span>
                                )}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2 sm:px-3 text-gray-500 text-xs whitespace-nowrap">
                            {formatDate(entry.updatedAt)}
                          </td>
                          <td className="py-2 px-2 sm:px-3 text-center">
                            <RollbackAction
                              entry={entry}
                              onRollback={initiateRollback}
                              disabled={isSubmitting}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 text-gray-500 border rounded-md">
                Ingen historik endnu
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 px-4 py-4 sm:px-6 sm:py-5">
          <div className="w-full">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  Nulstil Tæller
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>Dette vil:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Nulstille tælleren til 0</li>
                      <li>Slette al historik</li>
                      <li>Fjerne alle tidligere optællinger</li>
                    </ul>
                    <p className="pt-2 font-semibold text-red-600">
                      Denne handling kan ikke fortrydes.
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                  <AlertDialogCancel className="mt-0">
                    Annuller
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleReset}
                    className="sm:ml-2 bg-red-600 hover:bg-red-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Arbejder...
                      </>
                    ) : (
                      "Nulstil"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardFooter>
      </Card>

      {/* Rollback confirmation dialog */}
      <AlertDialog
        open={isRollbackDialogOpen}
        onOpenChange={setIsRollbackDialogOpen}
      >
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Fjern handling</AlertDialogTitle>
            <AlertDialogDescription>
              {rollbackEntry && (
                <div className="space-y-2">
                  <p>
                    Er du sikker på, at du vil fjerne denne handling og rulle
                    tælleren tilbage?
                  </p>
                  <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-md">
                    <div className="grid grid-cols-2 gap-1">
                      <span className="text-sm text-slate-500">Fra:</span>
                      <span className="text-sm font-medium">
                        {formatDanishCurrency(count)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <span className="text-sm text-slate-500">Til:</span>
                      <span className="text-sm font-medium">
                        {formatDanishCurrency(rollbackEntry.previousValue || 0)}
                      </span>
                    </div>
                    {rollbackEntry.type === "special" &&
                      rollbackEntry.message && (
                        <div className="mt-1 pt-1 border-t text-sm text-slate-600">
                          Specialbesked: &ldquo;{rollbackEntry.message}&rdquo;
                        </div>
                      )}
                  </div>
                  <p className="text-sm text-slate-500 italic">
                    Dette vil slette handlingen fra historikken og rulle
                    tællerværdien tilbage.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="mt-0" disabled={isSubmitting}>
              Annuller
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRollback}
              className="sm:ml-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Arbejder...
                </>
              ) : (
                "Fjern og tilbagerul"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
