
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  Eye,
  Pill,
  RefreshCw,
} from "lucide-react";

import {
  todaySL,
  shiftDay,
  prettyDate,
  doseStatus,
  medicineName,
  getSchedule,
  useFamilyApi,
} from "./FamilyPortalShared";

import "../FamilyPortalProfessional.css";

export default function FamilyScheduleProfessional() {
  const [date, setDate] = useState(todaySL);

  const { data, loading, error, refresh } = useFamilyApi(
    `/schedule/${date}`
  );

  const schedule = [...getSchedule(data)].sort((a, b) =>
    String(a.time || "").localeCompare(String(b.time || ""))
  );

  const counts = {
    total: schedule.length,
    given: schedule.filter((x) => doseStatus(x) === "given").length,
    skipped: schedule.filter((x) => doseStatus(x) === "skipped").length,
    pending: schedule.filter((x) => doseStatus(x) === "pending").length,
  };

  return (
    <div className="fp-page">
      <section className="fp-hero fp-hero-compact">
        <div>
          <span className="fp-eyebrow">
            <Eye size={15} /> FAMILY MEDICATION TRACKING
          </span>
          <h2>Follow every medication moment.</h2>
          <p>
            Review medication times and recorded dose statuses
            without changing caregiver records.
          </p>
          <span className="fp-readonly">
            <Eye size={15} /> Read-only schedule
          </span>
        </div>
        <div className="fp-hero-symbol">
          <CalendarDays size={85} strokeWidth={1.2} />
        </div>
      </section>

      <section className="fp-panel">
        <div className="fp-panel-heading">
          <div>
            <h3>Medication Schedule</h3>
            <p>{prettyDate(date)}</p>
          </div>
          <span className="fp-readonly">
            <Eye size={14} /> View only
          </span>
        </div>

        <div className="fp-date-controls">
          <button
            aria-label="Previous day"
            onClick={() => setDate((d) => shiftDay(d, -1))}
          >
            <ArrowLeft size={17} />
          </button>
          <input
            type="date"
            value={date}
            aria-label="Schedule date"
            onChange={(e) => e.target.value && setDate(e.target.value)}
          />
          <button
            aria-label="Next day"
            onClick={() => setDate((d) => shiftDay(d, 1))}
          >
            <ArrowRight size={17} />
          </button>
          <button onClick={() => setDate(todaySL())}>Today</button>
          <button onClick={refresh} disabled={loading}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </section>

      <div className="fp-mini-stats">
        {[
          ["Total Doses", counts.total, "teal"],
          ["Given", counts.given, "green"],
          ["Pending", counts.pending, "orange"],
          ["Skipped", counts.skipped, "red"],
        ].map(([label, count, tone]) => (
          <div className="fp-mini-stat" key={label}>
            <span>{label}</span>
            <strong className={`fp-text-${tone}`}>
              {loading || error ? "—" : count}
            </strong>
          </div>
        ))}
      </div>

      <section className="fp-panel">
        <div className="fp-panel-heading">
          <div>
            <h3>Medication Timeline</h3>
            <p>Scheduled doses and their recorded outcomes</p>
          </div>
          <Clock3 size={20} />
        </div>

        {error && <p className="fp-error" role="alert">{error}</p>}

        {loading ? (
          <p className="fp-empty">Loading schedule...</p>
        ) : error ? null : schedule.length === 0 ? (
          <p className="fp-empty">
            No medications scheduled for this date.
          </p>
        ) : (
          <div className="fp-timeline">
            {schedule.map((dose, index) => {
              const status = doseStatus(dose);

              return (
                <div className="fp-timeline-row" key={index}>
                  <div className="fp-timeline-time">
                    {dose.time || "—"}
                  </div>

                  <article className="fp-timeline-card">
                    <span className="fp-record-icon">
                      <Pill size={20} />
                    </span>

                    <div className="fp-timeline-info">
                      <strong>{medicineName(dose)}</strong>
                      <small>
                        {dose.dose ||
                          dose.medicine?.dose ||
                          "Scheduled dose"}
                      </small>
                      {status === "skipped" && dose.skipReason && (
                        <p>Reason: {dose.skipReason}</p>
                      )}
                    </div>

                    <span className={`fp-status fp-status-${status}`}>
                      {status}
                    </span>
                  </article>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
