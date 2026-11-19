
import { useEffect, useState } from "react";

const API = "http://localhost:5000/api";

function getToday() {
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

export default function FamilySchedule() {
  const [date, setDate] = useState(getToday);
  const [doses, setDoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadSchedule() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API}/schedule/${date}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Unable to load schedule");
        }

        const data = await response.json();

        setDoses(
          Array.isArray(data)
            ? data
            : data.schedule || data.doses || []
        );
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadSchedule();

    return () => controller.abort();
  }, [date]);

  return (
    <section className="cp-readonly-page">
      <div className="cp-content-heading">
        <div>
          <h2>Medication Schedule</h2>
          <p>
            View medication progress and dose records.
          </p>
        </div>

        <span className="cp-readonly-badge">
          View Only
        </span>
      </div>

      <div className="cp-panel">
        <div className="cp-date-filter">
          <label htmlFor="family-schedule-date">
            Select Date
          </label>

          <input
            id="family-schedule-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {error && (
          <p className="cp-error" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <p className="cp-empty">Loading schedule...</p>
        ) : doses.length === 0 ? (
          <p className="cp-empty">
            No medication scheduled for this date.
          </p>
        ) : (
          <div className="cp-readonly-list">
            {doses.map((dose, index) => (
              <div
                key={`${dose.medicineId}-${dose.time}-${index}`}
                className="cp-readonly-item"
              >
                <div className="cp-readonly-time">
                  {dose.time}
                </div>

                <div className="cp-readonly-details">
                  <h3>
                    {dose.medicineName ||
                      dose.name ||
                      dose.medicine?.name ||
                      "Medicine"}
                  </h3>

                  <p>
                    Dose:{" "}
                    {dose.dose ||
                      dose.medicine?.dose ||
                      "Not specified"}
                  </p>

                  {dose.status === "skipped" &&
                    dose.skipReason && (
                      <p>
                        Reason: {dose.skipReason}
                      </p>
                    )}
                </div>

                <span
                  className={`cp-status cp-status-${dose.status}`}
                >
                  {dose.status || "pending"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
