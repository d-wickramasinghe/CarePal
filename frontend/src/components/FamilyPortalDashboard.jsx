
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  Package,
  Pill,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  TrendingUp,
} from "lucide-react";

import {
  todaySL,
  prettyDate,
  doseStatus,
  medicineName,
  stockStatus,
  stockQuantity,
  adherenceSummary,
  useFamilyApi,
  getSchedule,
  getStockItems,
} from "./FamilyPortalShared";

import "../FamilyPortalProfessional.css";

const today = todaySL();

function Metric({ icon: Icon, title, value, subtitle, tone }) {
  return (
    <article className="fp-metric">
      <div className={`fp-metric-icon fp-tone-${tone}`}>
        <Icon size={22} />
      </div>
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{subtitle}</small>
    </article>
  );
}

export default function FamilyPortalDashboard({ onNavigate }) {
  const scheduleApi = useFamilyApi(`/schedule/${today}`);
  const weeklyApi = useFamilyApi(
    `/dashboard/weekly?endDate=${today}`
  );
  const stockApi = useFamilyApi("/stock");
  const medicinesApi = useFamilyApi("/medicines");

  const schedule = getSchedule(scheduleApi.data);
  const stock = getStockItems(stockApi.data);
  const medicines = Array.isArray(medicinesApi.data)
    ? medicinesApi.data
    : medicinesApi.data?.medicines || [];

  const weekly = adherenceSummary(weeklyApi.data);

  const given = schedule.filter(
    (item) => doseStatus(item) === "given"
  ).length;

  const pending = schedule.filter(
    (item) => doseStatus(item) === "pending"
  ).length;

  const alerts = stock.filter(
    (item) => stockStatus(item) !== "healthy"
  );

  const loading =
    scheduleApi.loading ||
    weeklyApi.loading ||
    stockApi.loading ||
    medicinesApi.loading;

  const errors = [
    scheduleApi.error,
    weeklyApi.error,
    stockApi.error,
    medicinesApi.error,
  ].filter(Boolean);

  function refreshAll() {
    scheduleApi.refresh();
    weeklyApi.refresh();
    stockApi.refresh();
    medicinesApi.refresh();
  }

  const progress = schedule.length
    ? Math.round((given / schedule.length) * 100)
    : 0;

  return (
    <div className="fp-page">
      <section className="fp-hero">
        <div>
          <span className="fp-eyebrow">
            <HeartHandshake size={15} />
            FAMILY CARE PORTAL
          </span>

          <h2>Stay connected to every step of care.</h2>

          <p>
            Follow medication progress, stay informed about
            daily schedules, and monitor medicine availability.
          </p>

          <div className="fp-hero-actions">
            <button onClick={() => onNavigate("schedule")}>
              <CalendarDays size={17} />
              View Medication Schedule
              <ArrowRight size={16} />
            </button>
            <span>{prettyDate(today)}</span>
          </div>
        </div>

        <img
          src="../../public/family-illustration.png"
          alt="Family healthcare illustration"
        />
      </section>

      <div className="fp-section-heading">
        <div>
          <span className="fp-eyebrow">FAMILY OVERVIEW</span>
          <h2>Care at a Glance</h2>
          <p>Latest available medication information</p>
        </div>

        <button className="fp-outline-btn" onClick={refreshAll}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {errors.length > 0 && (
        <div className="fp-error" role="alert">
          <TriangleAlert size={17} />
          Some dashboard information could not be loaded.
        </div>
      )}

      <div className="fp-metrics">
        <Metric
          icon={Pill}
          title="Total Medicines"
          value={medicinesApi.error || medicinesApi.loading ? "—" : medicines.length}
          subtitle="Registered medicines"
          tone="teal"
        />
        <Metric
          icon={CheckCircle2}
          title="Given Today"
          value={scheduleApi.error || scheduleApi.loading ? "—" : given}
          subtitle="Completed medication doses"
          tone="green"
        />
        <Metric
          icon={Clock3}
          title="Pending Today"
          value={scheduleApi.error || scheduleApi.loading ? "—" : pending}
          subtitle="Awaiting confirmation"
          tone="orange"
        />
        <Metric
          icon={TrendingUp}
          title="Weekly Adherence"
          value={
            weeklyApi.error || weeklyApi.loading
              ? "—"
              : weekly.rate === null
              ? "N/A"
              : `${weekly.rate}%`
          }
          subtitle="Based on recorded doses"
          tone="purple"
        />
      </div>

      <div className="fp-two-columns">
        <section className="fp-panel">
          <div className="fp-panel-heading">
            <div>
              <h3>Today's Medication Progress</h3>
              <p>{prettyDate(today)}</p>
            </div>
            <Activity size={20} />
          </div>

          <div className="fp-progress-number">
            <strong>{scheduleApi.loading ? "—" : `${progress}%`}</strong>
            <span>Marked as Given</span>
          </div>

          <div className="fp-progress-track">
            <div style={{ width: `${progress}%` }} />
          </div>

          <div className="fp-progress-details">
            <span>{given} Given</span>
            <span>{pending} Pending</span>
            <span>{schedule.length} Total</span>
          </div>

          <button
            className="fp-text-action"
            onClick={() => onNavigate("schedule")}
          >
            View full schedule <ArrowRight size={16} />
          </button>
        </section>

        <section className="fp-panel">
          <div className="fp-panel-heading">
            <div>
              <h3>Weekly Adherence</h3>
              <p>Given versus skipped doses</p>
            </div>
            <ShieldCheck size={20} />
          </div>

          <div className="fp-adherence-layout">
            <div
              className="fp-donut"
              style={{
                "--fp-rate": `${weekly.rate ?? 0}%`,
              }}
            >
              <div>
                <strong>
                  {weeklyApi.loading || weeklyApi.error
                    ? "—"
                    : weekly.rate === null
                    ? "N/A"
                    : `${weekly.rate}%`}
                </strong>
                <span>Adherence</span>
              </div>
            </div>

            <div className="fp-adherence-details">
              <p><i className="fp-dot-green" /> Given <b>{weekly.given}</b></p>
              <p><i className="fp-dot-red" /> Skipped <b>{weekly.skipped}</b></p>
              <p><i className="fp-dot-gray" /> Pending <b>{weekly.pending}</b></p>
            </div>
          </div>

          <button
            className="fp-text-action"
            onClick={() => onNavigate("family")}
          >
            View adherence report <ArrowRight size={16} />
          </button>
        </section>
      </div>

      <div className="fp-two-columns">
        <section className="fp-panel">
          <div className="fp-panel-heading">
            <div>
              <h3>Today's Medicines</h3>
              <p>Read-only medication schedule</p>
            </div>
            <CalendarDays size={20} />
          </div>

          {scheduleApi.loading ? (
            <p className="fp-empty">Loading schedule...</p>
          ) : scheduleApi.error ? (
            <p className="fp-empty">Schedule unavailable.</p>
          ) : schedule.length === 0 ? (
            <p className="fp-empty">No doses scheduled today.</p>
          ) : (
            <div className="fp-record-list">
              {[...schedule]
                .sort((a, b) =>
                  String(a.time || "").localeCompare(
                    String(b.time || "")
                  )
                )
                .slice(0, 4)
                .map((item, index) => (
                  <div className="fp-record" key={index}>
                    <span className="fp-record-icon">
                      <Pill size={18} />
                    </span>
                    <div>
                      <strong>{medicineName(item)}</strong>
                      <small>
                        {item.time || "—"} · {item.dose || item.medicine?.dose || "Dose"}
                      </small>
                    </div>
                    <span className={`fp-status fp-status-${doseStatus(item)}`}>
                      {doseStatus(item)}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </section>

        <section className="fp-panel">
          <div className="fp-panel-heading">
            <div>
              <h3>Medicine Stock Alerts</h3>
              <p>Availability and restocking awareness</p>
            </div>
            <Package size={20} />
          </div>

          {stockApi.loading ? (
            <p className="fp-empty">Loading stock...</p>
          ) : stockApi.error ? (
            <p className="fp-empty">Stock information unavailable.</p>
          ) : alerts.length === 0 ? (
            <div className="fp-healthy">
              <CheckCircle2 size={25} />
              <strong>No stock alerts</strong>
              <span>No low-stock items detected.</span>
            </div>
          ) : (
            <div className="fp-record-list">
              {alerts.slice(0, 4).map((item, index) => (
                <div className="fp-record" key={index}>
                  <span className="fp-record-icon fp-warning-icon">
                    <TriangleAlert size={18} />
                  </span>
                  <div>
                    <strong>{medicineName(item)}</strong>
                    <small>{stockQuantity(item)} units remaining</small>
                  </div>
                  <span className={`fp-status fp-status-${stockStatus(item)}`}>
                    {stockStatus(item) === "out" ? "Out" : "Low"}
                  </span>
                </div>
              ))}
            </div>
          )}

          <button
            className="fp-text-action"
            onClick={() => onNavigate("stock")}
          >
            View stock overview <ArrowRight size={16} />
          </button>
        </section>
      </div>

      <section className="fp-panel">
        <div className="fp-panel-heading">
          <div>
            <h3>Quick Access</h3>
            <p>Explore medication information</p>
          </div>
        </div>

        <div className="fp-quick-grid">
          {[
            {
              title: "Medication Schedule",
              description: "Review daily medication records",
              page: "schedule",
              icon: CalendarDays,
            },
            {
              title: "Adherence Reports",
              description: "Explore weekly medication progress",
              page: "family",
              icon: TrendingUp,
            },
            {
              title: "Stock Overview",
              description: "Check available medicine stock",
              page: "stock",
              icon: Package,
            },
          ].map(({ title, description, page, icon: Icon }) => (
            <button
              key={page}
              className="fp-quick-action"
              onClick={() => onNavigate(page)}
            >
              <Icon size={23} />
              <strong>{title}</strong>
              <small>{description}</small>
              <ArrowRight size={15} />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
