
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Pill,
  RefreshCw,
  SkipForward,
  X,
} from "lucide-react";

import "../DailyScheduleProfessional.css";

const API = "http://localhost:5000/api";

function todayInSriLanka() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const date = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${date.year}-${date.month}-${date.day}`;
}

function changeDate(dateString, days) {
  const date = new Date(`${dateString}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDate(dateString) {
  return new Date(`${dateString}T12:00:00Z`)
    .toLocaleDateString("en-US", {
      timeZone: "UTC",
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
}

function normalizeStatus(value) {
  const status = String(value || "pending").toLowerCase();

  return ["given", "skipped"].includes(status)
    ? status
    : "pending";
}

function SummaryCard({ icon: Icon, label, value, tone }) {
  return (
    <div className={`ds-summary-card ds-${tone}`}>
      <span className="ds-summary-icon">
        <Icon size={21} />
      </span>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

export default function DailyScheduleProfessional() {
  const [selectedDate, setSelectedDate] = useState(
    todayInSriLanka
  );

  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [skipDose, setSkipDose] = useState(null);
  const [skipReason, setSkipReason] = useState("");

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API}/schedule/${selectedDate}`
      );

      if (!response.ok) {
        throw new Error("Unable to load medication schedule.");
      }

      const result = await response.json();

      const records = Array.isArray(result)
        ? result
        : result.schedule || result.doses || [];

      setSchedule(records);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadSchedule();
    setSuccess("");
  }, [loadSchedule]);

  const sortedSchedule = useMemo(
    () =>
      [...schedule].sort((a, b) =>
        String(a.time || "").localeCompare(
          String(b.time || "")
        )
      ),
    [schedule]
  );

  const counts = useMemo(() => {
    const given = schedule.filter(
      (item) => normalizeStatus(item.status) === "given"
    ).length;

    const skipped = schedule.filter(
      (item) => normalizeStatus(item.status) === "skipped"
    ).length;

    return {
      total: schedule.length,
      given,
      skipped,
      pending: schedule.length - given - skipped,
    };
  }, [schedule]);

  function getDoseKey(dose) {
    return `${dose.medicineId || dose._id}-${dose.time}`;
  }

  async function updateDose(dose, status, reason = "") {
    const key = getDoseKey(dose);
    setSavingKey(key);
    setError("");
    setSuccess("");

    try {
      const medicineId =
        dose.medicineId || dose.medicine?._id;

      if (!medicineId) {
        throw new Error(
          "Medicine ID missing. Please check schedule API response."
        );
      }

      const response = await fetch(
        `${API}/schedule/status/update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            medicineId,
            date: selectedDate,
            time: dose.time,
            status,
            skipReason: status === "skipped" ? reason : "",
          }),
        }
      );

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));

        throw new Error(
          result.message ||
            result.error ||
            "Unable to update dose status."
        );
      }

      setSuccess(
        status === "given"
          ? "Dose successfully marked as Given."
          : "Dose successfully marked as Skipped."
      );

      setSkipDose(null);
      setSkipReason("");

      await loadSchedule();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingKey(null);
    }
  }

  function openSkipModal(dose) {
    setSkipDose(dose);
    setSkipReason("");
  }

  function closeSkipModal() {
    if (savingKey) return;

    setSkipDose(null);
    setSkipReason("");
  }

  function submitSkip(event) {
    event.preventDefault();

    if (!skipReason.trim()) {
      setError("Please provide a reason for skipping.");
      return;
    }

    updateDose(skipDose, "skipped", skipReason.trim());
  }

  return (
    <div className="ds-page">
      <section className="ds-hero">
        <div>
          <span className="ds-eyebrow">
            DAILY MEDICATION TRACKING
          </span>

          <h2>Stay on track, one dose at a time.</h2>

          <p>
            Review medication times, record completed doses,
            and keep daily care organized.
          </p>

          <div className="ds-hero-label">
            <CalendarDays size={16} />
            {formatDate(selectedDate)}
          </div>
        </div>

        <img
          src="../../public/schedule-illustration.png"
          alt="Medication schedule illustration"
        />
      </section>

      <section className="ds-date-toolbar">
        <div className="ds-date-heading">
          <span className="ds-date-icon">
            <CalendarDays size={20} />
          </span>

          <div>
            <h3>Medication Schedule</h3>
            <p>Select a date to view medication records</p>
          </div>
        </div>

        <div className="ds-date-actions">
          <button
            type="button"
            className="ds-icon-button"
            aria-label="Previous day"
            onClick={() =>
              setSelectedDate((date) => changeDate(date, -1))
            }
          >
            <ArrowLeft size={17} />
          </button>

          <input
            type="date"
            aria-label="Schedule date"
            value={selectedDate}
            onChange={(event) => {
              if (event.target.value) {
                setSelectedDate(event.target.value);
              }
            }}
          />

          <button
            type="button"
            className="ds-icon-button"
            aria-label="Next day"
            onClick={() =>
              setSelectedDate((date) => changeDate(date, 1))
            }
          >
            <ArrowRight size={17} />
          </button>

          <button
            type="button"
            className="ds-today-button"
            onClick={() => setSelectedDate(todayInSriLanka())}
          >
            Today
          </button>

          <button
            type="button"
            className="ds-refresh-button"
            onClick={loadSchedule}
            disabled={loading || Boolean(savingKey)}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </section>

      <div className="ds-summary-grid">
        <SummaryCard
          icon={Pill}
          label="Total Doses"
          value={loading ? "—" : counts.total}
          tone="teal"
        />

        <SummaryCard
          icon={CheckCircle2}
          label="Given"
          value={loading ? "—" : counts.given}
          tone="green"
        />

        <SummaryCard
          icon={Clock3}
          label="Pending"
          value={loading ? "—" : counts.pending}
          tone="orange"
        />

        <SummaryCard
          icon={AlertCircle}
          label="Skipped"
          value={loading ? "—" : counts.skipped}
          tone="red"
        />
      </div>

      {error && (
        <div className="ds-alert ds-alert-error" role="alert">
          <AlertCircle size={17} />
          {error}
        </div>
      )}

      {success && (
        <div className="ds-alert ds-alert-success" role="status">
          <CheckCircle2 size={17} />
          {success}
        </div>
      )}

      <section className="ds-timeline-panel">
        <div className="ds-panel-heading">
          <div>
            <span className="ds-eyebrow">
              MEDICATION TIMELINE
            </span>
            <h3>Today's Medication Plan</h3>
            <p>{formatDate(selectedDate)}</p>
          </div>

          <span className="ds-dose-count">
            {counts.total} scheduled doses
          </span>
        </div>

        {loading ? (
          <div className="ds-empty">
            Loading medication schedule...
          </div>
        ) : sortedSchedule.length === 0 ? (
          <div className="ds-empty">
            <CalendarDays size={34} />
            <h3>No medication scheduled</h3>
            <p>No doses found for the selected date.</p>
          </div>
        ) : (
          <div className="ds-timeline">
            {sortedSchedule.map((dose, index) => {
              const status = normalizeStatus(dose.status);
              const key = getDoseKey(dose);
              const isSaving = savingKey === key;

              return (
                <div
                  className="ds-timeline-item"
                  key={`${key}-${index}`}
                >
                  <div className="ds-time-column">
                    <strong>{dose.time || "—"}</strong>
                    <span className={`ds-timeline-dot ds-dot-${status}`} />
                  </div>

                  <article className="ds-dose-card">
                    <div className="ds-dose-main">
                      <div className="ds-pill-icon">
                        <Pill size={21} />
                      </div>

                      <div className="ds-dose-details">
                        <h4>
                          {dose.medicineName ||
                            dose.name ||
                            dose.medicine?.name ||
                            "Medicine"}
                        </h4>

                        <p>
                          {dose.dose ||
                            dose.medicine?.dose ||
                            "Scheduled medication dose"}
                        </p>
                      </div>

                      <span className={`ds-status ds-status-${status}`}>
                        {status === "given" && (
                          <Check size={13} />
                        )}

                        {status === "pending" && (
                          <Clock3 size={13} />
                        )}

                        {status === "skipped" && (
                          <AlertCircle size={13} />
                        )}

                        {status}
                      </span>
                    </div>

                    {dose.skipReason && status === "skipped" && (
                      <div className="ds-skip-reason">
                        Reason: {dose.skipReason}
                      </div>
                    )}

                    <div className="ds-dose-footer">
                      <span>
                        <Activity size={15} />
                        Medication tracking
                      </span>

                      <div className="ds-dose-actions">
                        <button
                          type="button"
                          className="ds-given-button"
                          disabled={
                            isSaving || Boolean(savingKey) ||
                            status === "given"
                          }
                          onClick={() =>
                            updateDose(dose, "given")
                          }
                        >
                          <Check size={15} />
                          {isSaving ? "Saving..." : "Mark Given"}
                        </button>

                        <button
                          type="button"
                          className="ds-skip-button"
                          disabled={
                            Boolean(savingKey) ||
                            status === "skipped"
                          }
                          onClick={() => openSkipModal(dose)}
                        >
                          <SkipForward size={15} />
                          Skip Dose
                        </button>
                      </div>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {skipDose && (
        <div
          className="ds-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeSkipModal();
            }
          }}
        >
          <section
            className="ds-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ds-modal-title"
          >
            <div className="ds-modal-header">
              <div>
                <span className="ds-eyebrow">
                  MEDICATION STATUS
                </span>
                <h2 id="ds-modal-title">Skip Medication Dose</h2>
                <p>
                  Please provide a reason for skipping.
                </p>
              </div>

              <button
                type="button"
                onClick={closeSkipModal}
                aria-label="Close"
                disabled={Boolean(savingKey)}
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={submitSkip}>
              <label htmlFor="ds-skip-reason">
                Reason for skipping
              </label>

              <textarea
                id="ds-skip-reason"
                value={skipReason}
                onChange={(event) =>
                  setSkipReason(event.target.value)
                }
                placeholder="e.g. Patient refused medication"
                rows={4}
                required
              />

              <div className="ds-modal-actions">
                <button
                  type="button"
                  className="ds-cancel-button"
                  onClick={closeSkipModal}
                  disabled={Boolean(savingKey)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="ds-confirm-button"
                  disabled={Boolean(savingKey)}
                >
                  {savingKey ? "Saving..." : "Confirm Skip"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
