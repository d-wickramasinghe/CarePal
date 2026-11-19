
import { useEffect, useState } from "react";

function getToday() {
  const now = new Date();

  const local = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  );

  return local.toISOString().slice(0, 10);
}

function FamilyDashboard() {
  const [endDate, setEndDate] = useState(getToday);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `http://localhost:5000/api/dashboard/weekly?endDate=${endDate}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Failed to load family dashboard");
        }

        const data = await response.json();
        setDashboard(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
          setDashboard(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => controller.abort();
  }, [endDate]);

  if (loading) {
    return <p>Loading family dashboard...</p>;
  }

  if (error) {
    return <p className="error" role="alert">{error}</p>;
  }

  if (!dashboard) {
    return null;
  }

  const { summary, dailyStats, skippedDoses, period } =
    dashboard;

  const adherence = summary.adherencePercentage;

  const stats = [
    {
      label: "Adherence Rate",
      value: adherence === null ? "N/A" : `${adherence}%`,
      icon: "📊",
    },
    {
      label: "Given Doses",
      value: summary.totalGiven,
      icon: "✅",
    },
    {
      label: "Skipped Doses",
      value: summary.totalSkipped,
      icon: "❌",
    },
    {
      label: "Pending Doses",
      value: summary.totalPending,
      icon: "⏰",
    },
  ];

  return (
    <section className="family-dashboard">
      <div className="dashboard-header">
        <div>
          <h2>Family Dashboard</h2>
          <p>Weekly Medication Overview</p>
        </div>

        <div>
          <label htmlFor="dashboard-date">
            Week Ending
          </label>

          <input
            id="dashboard-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <p className="dashboard-period">
        {period.startDate} to {period.endDate}
      </p>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className="stat-icon">{stat.icon}</div>
            <p>{stat.label}</p>
            <h3>{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="dashboard-panel">
        <h3>Weekly Adherence</h3>

        <div className="adherence-heading">
          <strong>
            {adherence === null ? "N/A" : `${adherence}%`}
          </strong>

          <span>
            {summary.totalGiven} of{" "}
            {summary.totalRecorded} recorded doses given
          </span>
        </div>

        <div
          className="progress-track"
          role="progressbar"
          aria-label="Weekly adherence"
          aria-valuenow={adherence ?? 0}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="progress-fill"
            style={{ width: `${adherence ?? 0}%` }}
          />
        </div>

        <p className="dashboard-hint">
          Adherence = Given / (Given + Skipped).
          Pending doses are not included.
        </p>
      </div>

      <div className="dashboard-panel">
        <h3>Daily Breakdown</h3>

        <div className="daily-stats">
          {dailyStats.map((day) => (
            <div className="daily-row" key={day.date}>
              <div>
                <strong>{day.date}</strong>
                <p>
                  {day.given} given · {day.skipped} skipped
                  · {day.pending} pending
                </p>
              </div>

              <span className="daily-percentage">
                {day.adherence === null
                  ? "N/A"
                  : `${day.adherence}%`}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-panel">
        <h3>Skipped Medicines</h3>

        {skippedDoses.length === 0 ? (
          <p>No skipped doses recorded this week.</p>
        ) : (
          <div className="skipped-list">
            {skippedDoses.map((item) => (
              <div
                className="skipped-item"
                key={`${item.medicineId}-${item.date}-${item.time}`}
              >
                <div>
                  <h4>{item.name}</h4>

                  <p>
                    {item.date} at {item.time}
                  </p>

                  <p>
                    <strong>Reason:</strong> {item.reason}
                  </p>
                </div>

                <span className="skipped-badge">
                  Skipped
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default FamilyDashboard;
