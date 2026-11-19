
import { useEffect, useState } from "react";

function DailySchedule({ readOnly = false }) {
  const [date, setDate] = useState(() => {
    const now = new Date();
    const localDate = new Date(
      now.getTime() - now.getTimezoneOffset() * 60000
    );
    return localDate.toISOString().slice(0, 10);
  });

  const [schedule, setSchedule] = useState([]);
  const [skipReasons, setSkipReasons] = useState({});
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState("");
  const [error, setError] = useState("");

  const loadSchedule = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:5000/api/schedule/${date}`
      );

      if (!response.ok) {
        throw new Error("Failed to load schedule");
      }

      const data = await response.json();
      setSchedule(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, [date]);

  const updateStatus = async (item, status) => {
    const key = `${item.medicineId}-${item.time}`;

    const skipReason = skipReasons[key] || "";

    if (status === "skipped" && !skipReason.trim()) {
      setError("Please enter a reason before skipping.");
      return;
    }

    setSavingKey(key);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/schedule/status/update",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            medicineId: item.medicineId,
            date,
            time: item.time,
            status,
            skipReason,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Update failed");
      }

      await loadSchedule();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingKey("");
    }
  };

  return (
    <section className="medicine-list">
      <h2>Daily Medicine Schedule</h2>

      <label htmlFor="schedule-date">Select Date</label>
      <input
        id="schedule-date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      {loading && <p>Loading schedule...</p>}
      {error && <p role="alert" className="error">{error}</p>}

      {!loading && schedule.length === 0 && !error && (
        <p>No medicines scheduled for this date.</p>
      )}

      {schedule.map((item) => {
        const key = `${item.medicineId}-${item.time}`;

        return (
          <div className="medicine-card" key={key}>
            <div className="schedule-heading">
              <h3>{item.name}</h3>

              <span className={`status ${item.status}`}>
                {item.status.toUpperCase()}
              </span>
            </div>

            <p>
              <strong>Time:</strong> {item.time}
            </p>
            <p>
              <strong>Strength:</strong> {item.strength}
            </p>
            <p>
              <strong>Dose:</strong> {item.dose}
            </p>
            <p>
              <strong>Food:</strong> {item.food}
            </p>

            {item.status === "skipped" && (
              <p>
                <strong>Previous Skip Reason:</strong>{" "}
                {item.skipReason}
              </p>
            )}

            <label htmlFor={`reason-${key}`}>
              Reason (required if skipped)
            </label>

            <input
              id={`reason-${key}`}
              type="text"
              placeholder="e.g. Patient refused"
              value={skipReasons[key] ?? item.skipReason ?? ""}
              onChange={(e) =>
                setSkipReasons((prev) => ({
                  ...prev,
                  [key]: e.target.value,
                }))
              }
            />

            <div className="schedule-actions">
              <button
                type="button"
                className="given-btn"
                disabled={savingKey === key}
                onClick={() => updateStatus(item, "given")}
              >
                Mark Given
              </button>

              <button
                type="button"
                className="skipped-btn"
                disabled={savingKey === key}
                onClick={() => updateStatus(item, "skipped")}
              >
                Mark Skipped
              </button>
            </div>
          </div>
        );
      })}
    </section>
  );
}

export default DailySchedule;
