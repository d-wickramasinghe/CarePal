
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  RefreshCw,
  TrendingUp,
  XCircle,
} from "lucide-react";

import "../AdherenceReportsProfessional.css";

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

function shiftDate(dateString, days) {
  const date = new Date(`${dateString}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDate(dateString, options = {}) {
  return new Date(`${dateString}T12:00:00Z`)
    .toLocaleDateString("en-US", {
      timeZone: "UTC",
      month: "short",
      day: "numeric",
      ...options,
    });
}

function safeCount(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0
    ? number
    : 0;
}

function calculateRate(given, skipped) {
  const recorded = given + skipped;

  return recorded > 0
    ? Math.round((given / recorded) * 100)
    : null;
}

function normalizeReport(data) {
  const summary = data?.summary || {};

  const given = safeCount(
    summary.given ?? summary.givenCount
  );

  const skipped = safeCount(
    summary.skipped ?? summary.skippedCount
  );

  const pending = safeCount(
    summary.pending ?? summary.pendingCount
  );

  const dailySource =
    data?.dailyBreakdown ||
    data?.daily ||
    data?.days ||
    [];

  const daily = Array.isArray(dailySource)
    ? dailySource
        .map((item) => {
          const date =
            item.date || item.day || item.dayDate;

          if (
            typeof date !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(date)
          ) {
            return null;
          }

          return {
            date,
            given: safeCount(
              item.given ?? item.givenCount
            ),
            skipped: safeCount(
              item.skipped ?? item.skippedCount
            ),
            pending: safeCount(
              item.pending ?? item.pendingCount
            ),
          };
        })
        .filter(Boolean)
    : [];

  return {
    given,
    skipped,
    pending,
    adherence: calculateRate(given, skipped),
    daily: daily.sort((a, b) =>
      a.date.localeCompare(b.date)
    ),
  };
}

function ReportMetric({ icon: Icon, label, value, detail, tone }) {
  return (
    <article className={`ar-metric ar-${tone}`}>
      <div className="ar-metric-top">
        <span className="ar-metric-icon">
          <Icon size={21} />
        </span>
        <Activity size={16} className="ar-metric-decoration" />
      </div>

      <p>{label}</p>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

export default function AdherenceReportsProfessional() {
  const [endDate, setEndDate] = useState(getToday);
  const [rawReport, setRawReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const startDate = shiftDate(endDate, -6);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API}/dashboard/weekly?endDate=${endDate}`
      );

      if (!response.ok) {
        throw new Error(
          "Unable to load weekly adherence report."
        );
      }

      const data = await response.json();
      setRawReport(data);
    } catch (err) {
      setRawReport(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [endDate]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const report = useMemo(
    () => normalizeReport(rawReport),
    [rawReport]
  );

  const total = report.given + report.skipped + report.pending;
  const recorded = report.given + report.skipped;

  const chartMax = Math.max(
    1,
    ...report.daily.map(
      (item) => item.given + item.skipped + item.pending
    )
  );

  const givenPercentage = recorded
    ? (report.given / recorded) * 100
    : 0;

  function exportCSV() {
    if (!rawReport || report.daily.length === 0) {
      return;
    }

    const rows = [
      ["Date", "Given", "Skipped", "Pending", "Adherence %"],
      ...report.daily.map((item) => [
        item.date,
        item.given,
        item.skipped,
        item.pending,
        calculateRate(item.given, item.skipped) ?? "N/A",
      ]),
    ];

    const csv = rows
      .map((row) => row.join(","))
      .join("\r\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `carepal-adherence-${startDate}-to-${endDate}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="ar-page">
      <section className="ar-hero">
        <div>
          <span className="ar-eyebrow">
            MEDICATION ANALYTICS
          </span>

          <h2>Better insights. Better medication care.</h2>

          <p>
            Understand medication adherence, review daily
            progress, and identify missed doses.
          </p>

          <div className="ar-hero-period">
            <CalendarDays size={16} />
            {formatDate(startDate)} –{" "}
            {formatDate(endDate, { year: "numeric" })}
          </div>
        </div>

        <img
          src="../../public/reports-illustration.png"
          alt="Healthcare analytics illustration"
        />
      </section>

      <section className="ar-toolbar">
        <div className="ar-toolbar-heading">
          <span className="ar-toolbar-icon">
            <CalendarDays size={21} />
          </span>

          <div>
            <h3>Weekly Adherence Report</h3>
            <p>Choose the last day of your reporting period</p>
          </div>
        </div>

        <div className="ar-toolbar-actions">
          <button
            type="button"
            className="ar-icon-button"
            aria-label="Previous week"
            onClick={() =>
              setEndDate((date) => shiftDate(date, -7))
            }
          >
            <ArrowLeft size={17} />
          </button>

          <input
            type="date"
            aria-label="Report end date"
            value={endDate}
            onChange={(event) => {
              if (event.target.value) {
                setEndDate(event.target.value);
              }
            }}
          />

          <button
            type="button"
            className="ar-icon-button"
            aria-label="Next week"
            onClick={() =>
              setEndDate((date) => shiftDate(date, 7))
            }
          >
            <ArrowRight size={17} />
          </button>

          <button
            type="button"
            className="ar-refresh-button"
            onClick={loadReport}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            type="button"
            className="ar-export-button"
            onClick={exportCSV}
            disabled={
              loading ||
              !rawReport ||
              report.daily.length === 0
            }
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </section>

      {error && (
        <div className="ar-error" role="alert">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="ar-metrics">
        <ReportMetric
          icon={TrendingUp}
          label="Adherence Rate"
          value={
            loading
              ? "—"
              : report.adherence === null
              ? "N/A"
              : `${report.adherence}%`
          }
          detail="Given / recorded doses"
          tone="teal"
        />

        <ReportMetric
          icon={CheckCircle2}
          label="Given Doses"
          value={loading ? "—" : report.given}
          detail="Successfully recorded"
          tone="green"
        />

        <ReportMetric
          icon={XCircle}
          label="Skipped Doses"
          value={loading ? "—" : report.skipped}
          detail="Recorded as skipped"
          tone="red"
        />

        <ReportMetric
          icon={Clock3}
          label="Pending Doses"
          value={loading ? "—" : report.pending}
          detail="Awaiting confirmation"
          tone="orange"
        />
      </div>

      <div className="ar-chart-grid">
        <section className="ar-card">
          <div className="ar-card-heading">
            <div>
              <h3>Adherence Overview</h3>
              <p>Given versus skipped recorded doses</p>
            </div>
            <TrendingUp size={19} />
          </div>

          <div className="ar-donut-layout">
            <div
              className="ar-donut"
              style={{
                "--ar-progress": `${givenPercentage}%`,
              }}
              role="img"
              aria-label={
                report.adherence === null
                  ? "No recorded doses"
                  : `${report.adherence}% adherence`
              }
            >
              <div className="ar-donut-center">
                <strong>
                  {loading
                    ? "—"
                    : report.adherence === null
                    ? "N/A"
                    : `${report.adherence}%`}
                </strong>
                <span>Adherence</span>
              </div>
            </div>

            <div className="ar-donut-details">
              <div>
                <span className="ar-legend-dot ar-legend-green" />
                <span>Given</span>
                <strong>{report.given}</strong>
              </div>

              <div>
                <span className="ar-legend-dot ar-legend-red" />
                <span>Skipped</span>
                <strong>{report.skipped}</strong>
              </div>

              <div>
                <span className="ar-legend-dot ar-legend-gray" />
                <span>Pending</span>
                <strong>{report.pending}</strong>
              </div>

              <p>
                Adherence is calculated from doses marked
                Given or Skipped. Pending doses are excluded.
              </p>
            </div>
          </div>
        </section>

        <section className="ar-card">
          <div className="ar-card-heading">
            <div>
              <h3>Daily Dose Activity</h3>
              <p>Medication status across the reporting period</p>
            </div>
            <Activity size={19} />
          </div>

          <div className="ar-chart-legend">
            <span><i className="ar-legend-green" /> Given</span>
            <span><i className="ar-legend-red" /> Skipped</span>
            <span><i className="ar-legend-gray" /> Pending</span>
          </div>

          {report.daily.length === 0 ? (
            <div className="ar-empty-chart">
              Daily breakdown is not available from the API.
            </div>
          ) : (
            <div className="ar-bars">
              {report.daily.map((item) => {
                const sum =
                  item.given + item.skipped + item.pending;

                const height = (sum / chartMax) * 100;

                return (
                  <div className="ar-bar-column" key={item.date}>
                    <div className="ar-bar-track">
                      <div
                        className="ar-bar-stack"
                        style={{ height: `${height}%` }}
                        title={`${item.date}: ${sum} doses`}
                      >
                        {sum > 0 && (
                          <>
                            <div
                              className="ar-bar-given"
                              style={{
                                height: `${
                                  (item.given / sum) * 100
                                }%`,
                              }}
                            />
                            <div
                              className="ar-bar-skipped"
                              style={{
                                height: `${
                                  (item.skipped / sum) * 100
                                }%`,
                              }}
                            />
                            <div
                              className="ar-bar-pending"
                              style={{
                                height: `${
                                  (item.pending / sum) * 100
                                }%`,
                              }}
                            />
                          </>
                        )}
                      </div>
                    </div>

                    <span>
                      {formatDate(item.date, {
                        weekday: "short",
                      }).split(" ")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <section className="ar-card">
        <div className="ar-card-heading">
          <div>
            <h3>Daily Breakdown</h3>
            <p>
              Detailed medication adherence for each available day
            </p>
          </div>

          <span className="ar-table-count">
            {report.daily.length} days
          </span>
        </div>

        {report.daily.length === 0 ? (
          <div className="ar-empty-chart">
            No daily breakdown records available.
          </div>
        ) : (
          <div className="ar-table-scroll">
            <table className="ar-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Given</th>
                  <th>Skipped</th>
                  <th>Pending</th>
                  <th>Total Doses</th>
                  <th>Adherence</th>
                </tr>
              </thead>

              <tbody>
                {report.daily.map((item) => {
                  const rate = calculateRate(
                    item.given,
                    item.skipped
                  );

                  return (
                    <tr key={item.date}>
                      <td>
                        <strong>
                          {formatDate(item.date, {
                            weekday: "short",
                          })}
                        </strong>
                      </td>

                      <td>
                        <span className="ar-table-given">
                          {item.given}
                        </span>
                      </td>

                      <td>
                        <span className="ar-table-skipped">
                          {item.skipped}
                        </span>
                      </td>

                      <td>{item.pending}</td>

                      <td>
                        {item.given +
                          item.skipped +
                          item.pending}
                      </td>

                      <td>
                        <span className="ar-rate-badge">
                          {rate === null
                            ? "N/A"
                            : `${rate}%`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="ar-footer-note">
        <AlertCircle size={17} />
        <p>
          Reports reflect recorded medication statuses and
          are intended for medication tracking, not clinical
          assessment.
        </p>
      </div>
    </div>
  );
}
