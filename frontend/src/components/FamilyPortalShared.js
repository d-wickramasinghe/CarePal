
import { useCallback, useEffect, useState } from "react";

const API = "http://localhost:5000/api";

export function todaySL() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export function shiftDay(date, amount) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + amount);
  return d.toISOString().slice(0, 10);
}

export function prettyDate(date) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString(
    "en-US",
    {
      timeZone: "UTC",
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }
  );
}

export function doseStatus(item) {
  const value = String(item.status || "pending").toLowerCase();
  return ["given", "skipped"].includes(value)
    ? value
    : "pending";
}

export function medicineName(item) {
  return (
    item.medicineName ||
    item.name ||
    item.medicine?.name ||
    "Medicine"
  );
}

export function stockQuantity(item) {
  const n = Number(item.stock ?? item.medicine?.stock);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export function daysRemaining(item) {
  if (item.daysRemaining != null) {
    const n = Number(item.daysRemaining);
    return Number.isFinite(n) ? Math.max(0, n) : null;
  }

  const times = item.times || item.medicine?.times;
  const perDay = Array.isArray(times) ? times.length : 0;

  return perDay > 0 ? stockQuantity(item) / perDay : null;
}

export function stockStatus(item) {
  if (stockQuantity(item) <= 0) return "out";

  const days = daysRemaining(item);
  const threshold = Number(
    item.lowStockDays ?? item.medicine?.lowStockDays ?? 3
  );

  if (days !== null && days <= threshold) return "low";

  const apiStatus = String(item.status || "").toLowerCase();

  if (["low", "low_stock"].includes(apiStatus)) return "low";
  if (["out", "out_of_stock"].includes(apiStatus)) return "out";

  return "healthy";
}

export function adherenceSummary(report) {
  const s = report?.summary || {};

  const given = Number(s.given ?? s.givenCount ?? 0);
  const skipped = Number(s.skipped ?? s.skippedCount ?? 0);
  const pending = Number(s.pending ?? s.pendingCount ?? 0);

  const recorded = given + skipped;

  return {
    given,
    skipped,
    pending,
    rate: recorded > 0
      ? Math.round((given / recorded) * 100)
      : null,
  };
}

export function useFamilyApi(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}${path}`);

      if (!response.ok) {
        throw new Error("Unable to load data. Please try again.");
      }

      setData(await response.json());
    } catch (err) {
      setData(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

export function getSchedule(data) {
  if (Array.isArray(data)) return data;
  return data?.schedule || data?.doses || [];
}

export function getStockItems(data) {
  if (Array.isArray(data)) return data;
  return data?.medicines || data?.stock || [];
}
