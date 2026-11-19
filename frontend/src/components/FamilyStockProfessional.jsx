
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Package,
  Pill,
  RefreshCw,
  Search,
} from "lucide-react";

import {
  medicineName,
  stockQuantity,
  stockStatus,
  daysRemaining,
  getStockItems,
  useFamilyApi,
} from "./FamilyPortalShared";

import "../FamilyPortalProfessional.css";

export default function FamilyStockProfessional() {
  const { data, loading, error, refresh } = useFamilyApi("/stock");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const medicines = getStockItems(data);

  const stats = useMemo(
    () => ({
      total: medicines.length,
      units: medicines.reduce(
        (sum, item) => sum + stockQuantity(item), 0
      ),
      low: medicines.filter(
        (item) => stockStatus(item) === "low"
      ).length,
      out: medicines.filter(
        (item) => stockStatus(item) === "out"
      ).length,
    }),
    [medicines]
  );

  const filtered = medicines.filter((item) => {
    const nameMatch = medicineName(item)
      .toLowerCase()
      .includes(search.trim().toLowerCase());

    return nameMatch &&
      (filter === "all" || stockStatus(item) === filter);
  });

  return (
    <div className="fp-page">
      <section className="fp-hero fp-hero-compact">
        <div>
          <span className="fp-eyebrow">
            <Eye size={15} /> FAMILY INVENTORY OVERVIEW
          </span>
          <h2>Stay informed about medicine availability.</h2>
          <p>
            Review remaining stock, estimated supply duration,
            and medicines that may need restocking.
          </p>
          <span className="fp-readonly">
            <Eye size={15} /> Read-only inventory
          </span>
        </div>

        <div className="fp-hero-symbol">
          <Package size={85} strokeWidth={1.2} />
        </div>
      </section>

      <div className="fp-section-heading">
        <div>
          <span className="fp-eyebrow">STOCK OVERVIEW</span>
          <h2>Medicine Inventory</h2>
          <p>Current stock information</p>
        </div>
        <button
          className="fp-outline-btn"
          onClick={refresh}
          disabled={loading}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && <div className="fp-error" role="alert">{error}</div>}

      <div className="fp-mini-stats">
        {[
          ["Total Medicines", stats.total, "teal"],
          ["Available Units", stats.units, "green"],
          ["Low Stock", stats.low, "orange"],
          ["Out of Stock", stats.out, "red"],
        ].map(([label, value, tone]) => (
          <div className="fp-mini-stat" key={label}>
            <span>{label}</span>
            <strong className={`fp-text-${tone}`}>
              {loading || error ? "—" : value}
            </strong>
          </div>
        ))}
      </div>

      {!loading && !error && (stats.low + stats.out > 0) && (
        <div className="fp-stock-warning">
          <AlertTriangle size={20} />
          <div>
            <strong>Stock attention required</strong>
            <p>
              {stats.low + stats.out} medicine(s) have low
              or unavailable stock.
            </p>
          </div>
        </div>
      )}

      <section className="fp-panel">
        <div className="fp-panel-heading">
          <div>
            <h3>Available Medicines</h3>
            <p>Review stock levels and remaining supply</p>
          </div>
          <span className="fp-readonly">
            <Eye size={14} /> View only
          </span>
        </div>

        <div className="fp-stock-toolbar">
          <div className="fp-search">
            <Search size={17} />
            <input
              type="search"
              placeholder="Search medicines..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Stock status filter"
          >
            <option value="all">All Medicines</option>
            <option value="healthy">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>

        {loading ? (
          <p className="fp-empty">Loading stock information...</p>
        ) : error ? null : filtered.length === 0 ? (
          <p className="fp-empty">No matching medicines found.</p>
        ) : (
          <div className="fp-stock-grid">
            {filtered.map((item, index) => {
              const status = stockStatus(item);
              const days = daysRemaining(item);

              const threshold = Number(
                item.lowStockDays ??
                item.medicine?.lowStockDays ??
                3
              );

              const reference = Math.max(
                7,
                Number.isFinite(threshold)
                  ? threshold * 2
                  : 7
              );

              const percent = days === null
                ? 0
                : Math.min(100, (days / reference) * 100);

              return (
                <article className="fp-stock-card" key={
                  item.medicineId || item._id || index
                }>
                  <div className="fp-stock-card-top">
                    <span className="fp-record-icon">
                      <Pill size={21} />
                    </span>
                    <span className={`fp-status fp-status-${status}`}>
                      {status === "healthy"
                        ? "In Stock"
                        : status === "low"
                        ? "Low Stock"
                        : "Out of Stock"}
                    </span>
                  </div>

                  <h3>{medicineName(item)}</h3>
                  <p>
                    {item.strength ||
                      item.medicine?.strength ||
                      "Medication"}
                  </p>

                  <div className="fp-stock-quantity">
                    <strong>{stockQuantity(item)}</strong>
                    <span>units remaining</span>
                  </div>

                  <div className="fp-stock-level-heading">
                    <span>Estimated supply</span>
                    <strong>
                      {days === null
                        ? "Unavailable"
                        : `${Number(days.toFixed(1))} days`}
                    </strong>
                  </div>

                  <div className="fp-progress-track">
                    <div
                      className={`fp-stock-fill fp-fill-${status}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="fp-stock-card-footer">
                    {status === "healthy" ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <AlertTriangle size={16} />
                    )}
                    {status === "healthy"
                      ? "No low-stock warning"
                      : "Restocking attention needed"}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
