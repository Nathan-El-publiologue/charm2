import { useState, useEffect, useCallback } from "react";

const DAILY_LIMIT = 50;
const STORAGE_KEY = "charmai_daily_messages";
const WHATSAPP_URL = "https://wa.me/243844749836";

interface DailyData {
  count: number;
  date: string;
}

const getToday = () => new Date().toISOString().split("T")[0];

const getStoredData = (): DailyData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DailyData;
      if (parsed.date === getToday()) return parsed;
    }
  } catch {}
  return { count: 0, date: getToday() };
};

export const useMessageLimit = () => {
  const [data, setData] = useState<DailyData>(getStoredData);

  useEffect(() => {
    // Reset at midnight
    const check = setInterval(() => {
      if (data.date !== getToday()) {
        const fresh = { count: 0, date: getToday() };
        setData(fresh);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      }
    }, 60000);
    return () => clearInterval(check);
  }, [data.date]);

  const remaining = Math.max(0, DAILY_LIMIT - data.count);
  const isLimitReached = data.count >= DAILY_LIMIT;
  const isNearLimit = remaining <= 10 && remaining > 0;

  const incrementCount = useCallback(() => {
    setData((prev) => {
      const updated = { count: prev.count + 1, date: getToday() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const openWhatsApp = useCallback(() => {
    window.open(WHATSAPP_URL, "_blank");
  }, []);

  return { remaining, isLimitReached, isNearLimit, incrementCount, openWhatsApp, dailyLimit: DAILY_LIMIT };
};
