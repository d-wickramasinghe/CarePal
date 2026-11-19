
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  Package,
  Pill,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";

import "../DashboardProfessional.css";

const API = "http://localhost:5000/api";

function getToday() {
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

function getStatus(value) {
  const status = String(value || "pending").toLowerCase();
  return ["given", "skipped"].includes(status)
    ? status
    : "pending";
}

function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }
  );
}

function MetricCard({ icon: Icon, label, value, detail, tone }) {
  return (
    <article className={`dp-metric dp-${tone}`}>
      <div className="dp-metric-top">
        <span className="dp-metric-icon">
          <Icon size={21} strokeWidth={2} />
        </span>
        <span className="dp-metric-indicator">
          <Activity size={15} />
        </span>
      </div>

      <div>
        <p>{label}</p>
        <h3>{value}</h3>
        <span className="dp-metric-detail">{detail}</span>
      </div>
    </article>
  );
}

function SectionHeading({ title, subtitle, action, onAction }) {
  return (
    <div className="dp-section-heading">
      <div>
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>

      {action && (
        <button type="button" onClick={onAction}>
          {action}
          <ArrowRight size={15} />
        </button>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`dp-status dp-status-${status}`}>
      {status === "given" && <Check size={12} />}
      {status === "skipped" && <TriangleAlert size={12} />}
      {status === "pending" && <Clock3 size={12} />}
      {status}
    </span>
  );
}

export default function DashboardHome({
  role,
  medicines = [],
  onNavigate,
}) {
  const [schedule, setSchedule] = useState([]);
  const [weekly, setWeekly] = useState(null);
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isCaregiver = role === "caregiver";
  const today = getToday();

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [scheduleRes, weeklyRes, stockRes] =
        await Promise.all([
          fetch(`${API}/schedule/${today}`),
          fetch(`${API}/dashboard/weekly?endDate=${today}`),
          fetch(`${API}/stock`),
        ]);

      if (
        !scheduleRes.ok ||
        !weeklyRes.ok ||
        !stockRes.ok
      ) {
        throw new Error("Dashboard data could not be loaded.");
      }

      const [scheduleData, weeklyData, stockData] =
        await Promise.all([
          scheduleRes.json(),
          weeklyRes.json(),
          stockRes.json(),
        ]);

      setSchedule(
        Array.isArray(scheduleData)
          ? scheduleData
          : scheduleData.schedule ||
            scheduleData.doses ||
            []
      );

      setWeekly(weeklyData);

      setStock(
        Array.isArray(stockData)
          ? stockData
          : stockData.medicines || []
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const counts = useMemo(() => {
    const given = schedule.filter(
      (dose) => getStatus(dose.status) === "given"
    ).length;

    const skipped = schedule.filter(
      (dose) => getStatus(dose.status) === "skipped"
    ).length;

    const pending = schedule.filter(
      (dose) => getStatus(dose.status) === "pending"
    ).length;

    return { given, skipped, pending };
  }, [schedule]);

  const summary = weekly?.summary || {};

  const weeklyGiven = Number(summary.given ?? 0);
  const weeklySkipped = Number(summary.skipped ?? 0);
  const weeklyPending = Number(summary.pending ?? 0);

  const recordedDoses = weeklyGiven + weeklySkipped;

  const calculatedAdherence =
    recordedDoses > 0
      ? Math.round((weeklyGiven / recordedDoses) * 100)
      : null;

  const rawAdherence =
    summary.adherencePercentage ?? calculatedAdherence;

  const adherenceValue =
    rawAdherence == null
      ? null
      : Math.max(
          0,
          Math.min(100, Number(rawAdherence) || 0)
        );

  const alerts = stock.filter((item) => {
    const status = String(item.status || "").toLowerCase();

    return (
      status === "low_stock" ||
      status === "out_of_stock" ||
      status === "low" ||
      status === "out"
    );
  });

  const sortedSchedule = useMemo(
    () =>
      [...schedule].sort((a, b) =>
        String(a.time || "").localeCompare(
          String(b.time || "")
        )
      ),
    [schedule]
  );

  return (
    <div className="dp-dashboard">
      <section className="dp-welcome">
        <div className="dp-welcome-content">
          <span className="dp-eyebrow">
            <HeartHandshake size={15} />
            {isCaregiver
              ? "CAREGIVER WORKSPACE"
              : "FAMILY CARE PORTAL"}
          </span>

          <h2>
            {isCaregiver
              ? "Every dose matters. Every day counts."
              : "Stay connected to better care."}
          </h2>

          <p>
            {isCaregiver
              ? "Keep medications organized, follow daily schedules, and support healthier routines."
              : "Follow medication progress, review adherence, and stay informed about stock availability."}
          </p>

          <div className="dp-welcome-actions">
            <button
              type="button"
              className="dp-primary-btn"
              onClick={() => onNavigate("schedule")}
            >
              <CalendarDays size={17} />
              View Daily Schedule
              <ArrowRight size={16} />
            </button>

            <span className="dp-welcome-date">
              {formatDate(today)}
            </span>
          </div>
        </div>

        <img
          src={
            isCaregiver
              ? "../../public/caregiver-illustration.png"
              : "../../public/family-illustration.png"
          }
          alt="Healthcare illustration"
          className="dp-welcome-image"
        />
      </section>

      <div className="dp-overview-heading">
        <div>
          <span className="dp-small-eyebrow">
            LIVE OVERVIEW
          </span>
          <h2>Medication Summary</h2>
          <p>Today's care at a glance</p>
        </div>

        <button
          type="button"
          className="dp-refresh-btn"
          onClick={loadDashboard}
          disabled={loading}
        >
          <RefreshCw size={16} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="dp-error" role="alert">
          <TriangleAlert size={18} />
          {error}
        </div>
      )}

      <div className="dp-metrics-grid">
        <MetricCard
          icon={Pill}
          label="Total Medicines"
          value={medicines.length}
          detail="Registered medications"
          tone="teal"
        />

        <MetricCard
          icon={CheckCircle2}
          label="Given Today"
          value={loading ? "—" : counts.given}
          detail="Successfully recorded doses"
          tone="green"
        />

        <MetricCard
          icon={Clock3}
          label="Pending Today"
          value={loading ? "—" : counts.pending}
          detail="Doses awaiting confirmation"
          tone="orange"
        />

        <MetricCard
          icon={TrendingUp}
          label="Weekly Adherence"
          value={
            loading
              ? "—"
              : adherenceValue == null
              ? "N/A"
              : `${adherenceValue}%`
          }
          detail="Given / recorded doses"
          tone="purple"
        />
      </div>

      <div className="dp-analytics-grid">
        <section className="dp-card">
          <SectionHeading
            title="Weekly Adherence"
            subtitle="Medication adherence performance"
            action="Full Report"
            onAction={() => onNavigate("family")}
          />

          <div className="dp-adherence-body">
            <div
              className="dp-donut"
              style={{
                "--progress": `${adherenceValue ?? 0}%`,
              }}
              role="img"
              aria-label={`Weekly adherence ${
                adherenceValue ?? "not available"
              } percent`}
            >
              <div className="dp-donut-center">
                <strong>
                  {adherenceValue == null
                    ? "N/A"
                    : `${adherenceValue}%`}
                </strong>
                <span>Adherence</span>
              </div>
            </div>

            <div className="dp-adherence-info">
              <div className="dp-adherence-line">
                <span className="dp-dot dp-dot-green" />
                <span>Given</span>
                <strong>{weeklyGiven}</strong>
              </div>

              <div className="dp-adherence-line">
                <span className="dp-dot dp-dot-red" />
                <span>Skipped</span>
                <strong>{weeklySkipped}</strong>
              </div>

              <div className="dp-adherence-line">
                <span className="dp-dot dp-dot-gray" />
                <span>Pending</span>
                <strong>{weeklyPending}</strong>
              </div>

              <div className="dp-adherence-note">
                <ShieldCheck size={17} />
                Based on recorded dose outcomes
              </div>
            </div>
          </div>
        </section>

        <section className="dp-card">
          <SectionHeading
            title="Today's Dose Progress"
            subtitle="Medication schedule completion"
            action="View Schedule"
            onAction={() => onNavigate("schedule")}
          />

          <div className="dp-progress-summary">
            <div className="dp-progress-icon">
              <Activity size={24} />
            </div>

            <div>
              <strong>
                {counts.given} of {schedule.length}
              </strong>
              <span>Doses marked as given</span>
            </div>
          </div>

          <div className="dp-progress-track">
            <div
              className="dp-progress-fill"
              style={{
                width: `${
                  schedule.length
                    ? (counts.given / schedule.length) * 100
                    : 0
                }%`,
              }}
            />
          </div>

          <div className="dp-progress-labels">
            <span>Completed</span>
            <strong>
              {schedule.length
                ? Math.round(
                    (counts.given / schedule.length) * 100
                  )
                : 0}
              %
            </strong>
          </div>

          <div className="dp-mini-status-grid">
            <div>
              <span className="dp-mini-green">
                <CheckCircle2 size={17} />
              </span>
              <strong>{counts.given}</strong>
              <small>Given</small>
            </div>

            <div>
              <span className="dp-mini-orange">
                <Clock3 size={17} />
              </span>
              <strong>{counts.pending}</strong>
              <small>Pending</small>
            </div>

            <div>
              <span className="dp-mini-red">
                <TriangleAlert size={17} />
              </span>
              <strong>{counts.skipped}</strong>
              <small>Skipped</small>
            </div>
          </div>
        </section>
      </div>

      <div className="dp-details-grid">
        <section className="dp-card">
          <SectionHeading
            title="Today's Medication Schedule"
            subtitle={formatDate(today)}
            action="View All"
            onAction={() => onNavigate("schedule")}
          />

          {loading ? (
            <div className="dp-empty">Loading schedule...</div>
          ) : sortedSchedule.length === 0 ? (
            <div className="dp-empty">
              No medications scheduled today.
            </div>
          ) : (
            <div className="dp-schedule-list">
              {sortedSchedule.slice(0, 5).map((dose, index) => {
                const status = getStatus(dose.status);

                return (
                  <div
                    key={`${dose.medicineId}-${dose.time}-${index}`}
                    className="dp-schedule-row"
                  >
                    <div className="dp-schedule-pill">
                      <Pill size={19} />
                    </div>

                    <div className="dp-schedule-details">
                      <strong>
                        {dose.medicineName ||
                          dose.name ||
                          dose.medicine?.name ||
                          "Medicine"}
                      </strong>
                      <span>
                        {dose.dose ||
                          dose.medicine?.dose ||
                          "Scheduled dose"}
                      </span>
                    </div>

                    <div className="dp-schedule-meta">
                      <strong>{dose.time || "—"}</strong>
                      <StatusBadge status={status} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="dp-card">
          <SectionHeading
            title="Stock Alerts"
            subtitle="Medication inventory monitoring"
            action="View Stock"
            onAction={() => onNavigate("stock")}
          />

          <div className="dp-stock-heading">
            <span
              className={`dp-stock-icon ${
                alerts.length ? "has-alerts" : ""
              }`}
            >
              {alerts.length ? (
                <TriangleAlert size={22} />
              ) : (
                <Package size={22} />
              )}
            </span>

            <div>
              <strong>
                {alerts.length
                  ? `${alerts.length} Stock Alert${
                      alerts.length === 1 ? "" : "s"
                    }`
                  : "Stock Status Healthy"}
              </strong>

              <p>
                {alerts.length
                  ? "Some medicines need attention."
                  : "No low-stock alerts detected."}
              </p>
            </div>
          </div>

          {alerts.length > 0 && (
            <div className="dp-stock-list">
              {alerts.slice(0, 4).map((item, index) => (
                <div
                  className="dp-stock-item"
                  key={item.medicineId || index}
                >
                  <div>
                    <strong>
                      {item.name || "Medicine"}
                    </strong>
                    <span>
                      {item.stock ?? "?"} units remaining
                      {" · "}
                      {item.daysRemaining ?? "?"} days
                    </span>
                  </div>

                  <span className="dp-low-badge">
                    Low Stock
                  </span>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            className="dp-stock-action"
            onClick={() => onNavigate("stock")}
          >
            {isCaregiver
              ? "Manage Medicine Stock"
              : "View Stock Overview"}
            <ArrowRight size={16} />
          </button>
        </section>
      </div>

      <section className="dp-card dp-quick-card">
        <SectionHeading
          title="Quick Actions"
          subtitle="Frequently used features"
        />

        <div className="dp-quick-grid">
          {isCaregiver && (
            <button
              type="button"
              onClick={() => onNavigate("medicines")}
            >
              <span className="dp-quick-icon dp-q-teal">
                <Pill size={21} />
              </span>
              <strong>Manage Medicines</strong>
              <small>Add and organize medicines</small>
              <ArrowRight size={15} />
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigate("schedule")}
          >
            <span className="dp-quick-icon dp-q-blue">
              <CalendarDays size={21} />
            </span>
            <strong>Daily Schedule</strong>
            <small>Review scheduled doses</small>
            <ArrowRight size={15} />
          </button>

          <button
            type="button"
            onClick={() => onNavigate("family")}
          >
            <span className="dp-quick-icon dp-q-purple">
              <TrendingUp size={21} />
            </span>
            <strong>Adherence Reports</strong>
            <small>View weekly medication progress</small>
            <ArrowRight size={15} />
          </button>

          <button
            type="button"
            onClick={() => onNavigate("stock")}
          >
            <span className="dp-quick-icon dp-q-orange">
              <Package size={21} />
            </span>
            <strong>Stock Management</strong>
            <small>Monitor medicine inventory</small>
            <ArrowRight size={15} />
          </button>
        </div>
      </section>
    </div>
  );
}
