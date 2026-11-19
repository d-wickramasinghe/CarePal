
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Package,
  PackagePlus,
  Pill,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  TrendingUp,
  X,
  XCircle,
} from "lucide-react";

import "../StockManagementProfessional.css";

const API = "http://localhost:5000/api";

function getMedicineId(item) {
  return item.medicineId || item._id || item.medicine?._id;
}

function getMedicineName(item) {
  return item.name || item.medicineName ||
    item.medicine?.name || "Medicine";
}

function getStock(item) {
  return Math.max(0, Number(item.stock ?? item.medicine?.stock) || 0);
}

function getDaysRemaining(item) {
  const supplied = item.daysRemaining;

  if (supplied !== undefined && supplied !== null) {
    const value = Number(supplied);
    return Number.isFinite(value) ? Math.max(0, value) : null;
  }

  const times = item.times || item.medicine?.times;
  const dailyDoses = Array.isArray(times) ? times.length : 0;

  return dailyDoses > 0
    ? getStock(item) / dailyDoses
    : null;
}

function getStatus(item) {
  const stock = getStock(item);

  if (stock <= 0) return "out";

  const days = getDaysRemaining(item);
  const threshold = Number(
    item.lowStockDays ?? item.medicine?.lowStockDays ?? 3
  );

  if (days !== null && days <= threshold) return "low";

  const apiStatus = String(item.status || "").toLowerCase();

  if (["low", "low_stock"].includes(apiStatus)) return "low";
  if (["out", "out_of_stock"].includes(apiStatus)) return "out";

  return "healthy";
}

function StockCard({ item, onRestock }) {
  const stock = getStock(item);
  const days = getDaysRemaining(item);
  const status = getStatus(item);

  const threshold = Number(
    item.lowStockDays ?? item.medicine?.lowStockDays ?? 3
  );

  const referenceDays = Math.max(
    7,
    Number.isFinite(threshold) ? threshold * 2 : 7
  );

  const progress =
    days === null
      ? null
      : Math.min(100, (days / referenceDays) * 100);

  const statusLabels = {
    healthy: "In Stock",
    low: "Low Stock",
    out: "Out of Stock",
  };

  return (
    <article className="sm-card">
      <div className="sm-card-top">
        <div className="sm-card-icon">
          <Pill size={23} />
        </div>

        <span className={`sm-status sm-status-${status}`}>
          {status === "healthy" ? (
            <CheckCircle2 size={13} />
          ) : (
            <AlertTriangle size={13} />
          )}
          {statusLabels[status]}
        </span>
      </div>

      <h3>{getMedicineName(item)}</h3>

      <p className="sm-card-subtitle">
        {[
          item.strength || item.medicine?.strength,
          item.dose || item.medicine?.dose,
        ].filter(Boolean).join(" · ") || "Medication inventory"}
      </p>

      <div className="sm-stock-quantity">
        <div>
          <span>Available Stock</span>
          <strong>{stock}</strong>
          <small>units remaining</small>
        </div>

        <div className={`sm-stock-symbol sm-symbol-${status}`}>
          <Package size={25} />
        </div>
      </div>

      <div className="sm-progress-header">
        <span>Stock Level</span>
        <strong>
          {days === null
            ? "Days unavailable"
            : `${Number(days.toFixed(1))} days left`}
        </strong>
      </div>

      <div
        className="sm-progress-track"
        role="progressbar"
        aria-label={`${getMedicineName(item)} stock level`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress ?? 0}
      >
        <div
          className={`sm-progress-fill sm-progress-${status}`}
          style={{ width: `${progress ?? 0}%` }}
        />
      </div>

      <div className="sm-card-info">
        <span>
          <Clock3 size={15} />
          Low-stock threshold
        </span>
        <strong>
          {Number.isFinite(threshold) ? threshold : "—"} days
        </strong>
      </div>

      <button
        type="button"
        className="sm-restock-button"
        onClick={() => onRestock(item)}
        disabled={!getMedicineId(item)}
      >
        <PackagePlus size={17} />
        Restock Medicine
        <ArrowRight size={15} />
      </button>
    </article>
  );
}

export default function StockManagementProfessional() {
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [restockAmount, setRestockAmount] = useState("");

  const loadStock = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/stock`);

      if (!response.ok) {
        throw new Error("Unable to load medicine stock.");
      }

      const result = await response.json();

      setMedicines(
        Array.isArray(result)
          ? result
          : result.medicines || result.stock || []
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStock();
  }, [loadStock]);

  const stats = useMemo(() => {
    return {
      total: medicines.length,
      units: medicines.reduce(
        (sum, item) => sum + getStock(item),
        0
      ),
      low: medicines.filter(
        (item) => getStatus(item) === "low"
      ).length,
      out: medicines.filter(
        (item) => getStatus(item) === "out"
      ).length,
    };
  }, [medicines]);

  const filteredMedicines = useMemo(() => {
    const query = search.trim().toLowerCase();

    return medicines.filter((item) => {
      const name = getMedicineName(item).toLowerCase();

      const matchesSearch = name.includes(query);
      const matchesFilter =
        filter === "all" || getStatus(item) === filter;

      return matchesSearch && matchesFilter;
    });
  }, [medicines, search, filter]);

  const alerts = useMemo(
    () =>
      medicines.filter((item) =>
        ["low", "out"].includes(getStatus(item))
      ),
    [medicines]
  );

  function openRestock(item) {
    setSelectedMedicine(item);
    setRestockAmount("");
    setError("");
    setSuccess("");
  }

  function closeRestock() {
    if (saving) return;

    setSelectedMedicine(null);
    setRestockAmount("");
  }

  async function submitRestock(event) {
    event.preventDefault();

    if (!selectedMedicine || saving) return;

    const amount = Number(restockAmount);
    const medicineId = getMedicineId(selectedMedicine);

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setError("Please enter a valid positive whole number.");
      return;
    }

    if (!medicineId) {
      setError("Medicine ID is missing.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API}/stock/${medicineId}/restock`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ quantity: amount }),
        }
      );

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));

        throw new Error(
          result.message ||
          result.error ||
          "Unable to restock medicine."
        );
      }

      setSelectedMedicine(null);
      setRestockAmount("");

      await loadStock();

      setSuccess("Medicine stock updated successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="sm-page">
      <section className="sm-hero">
        <div>
          <span className="sm-eyebrow">
            MEDICATION INVENTORY
          </span>

          <h2>Keep every medicine within reach.</h2>

          <p>
            Monitor available stock, identify medicines
            running low, and manage restocking in one place.
          </p>

          <div className="sm-hero-tag">
            <Package size={16} />
            Inventory Monitoring
          </div>
        </div>

        <div className="sm-hero-visual" aria-hidden="true">
          <Package size={85} strokeWidth={1.25} />
          <Pill size={42} strokeWidth={1.5} />
        </div>
      </section>

      <div className="sm-section-title">
        <div>
          <span className="sm-eyebrow">LIVE INVENTORY</span>
          <h2>Stock Overview</h2>
          <p>Current medication inventory status</p>
        </div>

        <button
          type="button"
          className="sm-refresh-button"
          onClick={loadStock}
          disabled={loading || saving}
        >
          <RefreshCw size={16} />
          {loading ? "Refreshing..." : "Refresh Stock"}
        </button>
      </div>

      {error && (
        <div className="sm-alert sm-error" role="alert">
          <AlertTriangle size={17} />
          {error}
        </div>
      )}

      {success && (
        <div className="sm-alert sm-success" role="status">
          <CheckCircle2 size={17} />
          {success}
        </div>
      )}

      <div className="sm-stats-grid">
        <div className="sm-stat">
          <span className="sm-stat-icon sm-teal">
            <Pill size={22} />
          </span>
          <p>Total Medicines</p>
          <strong>{loading ? "—" : stats.total}</strong>
          <small>Registered inventory items</small>
        </div>

        <div className="sm-stat">
          <span className="sm-stat-icon sm-blue">
            <Package size={22} />
          </span>
          <p>Available Units</p>
          <strong>{loading ? "—" : stats.units}</strong>
          <small>Combined medicine stock</small>
        </div>

        <div className="sm-stat">
          <span className="sm-stat-icon sm-orange">
            <AlertTriangle size={22} />
          </span>
          <p>Low Stock</p>
          <strong>{loading ? "—" : stats.low}</strong>
          <small>Medicines needing attention</small>
        </div>

        <div className="sm-stat">
          <span className="sm-stat-icon sm-red">
            <XCircle size={22} />
          </span>
          <p>Out of Stock</p>
          <strong>{loading ? "—" : stats.out}</strong>
          <small>Medicines with zero units</small>
        </div>
      </div>

      {!loading && alerts.length > 0 && (
        <section className="sm-alert-panel">
          <div className="sm-alert-panel-icon">
            <AlertTriangle size={23} />
          </div>

          <div>
            <h3>Stock Attention Required</h3>
            <p>
              {alerts.length} medicine
              {alerts.length === 1 ? "" : "s"} need
              restocking attention.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setFilter("low")}
          >
            View Low Stock
            <ArrowRight size={15} />
          </button>
        </section>
      )}

      <section className="sm-inventory-panel">
        <div className="sm-inventory-heading">
          <div>
            <h3>Medicine Inventory</h3>
            <p>
              Search, monitor, and restock medicines
            </p>
          </div>

          <span className="sm-item-count">
            {filteredMedicines.length} items
          </span>
        </div>

        <div className="sm-toolbar">
          <div className="sm-search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search medicine name..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <div className="sm-filter">
            <SlidersHorizontal size={17} />

            <select
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value)
              }
              aria-label="Filter stock status"
            >
              <option value="all">All Medicines</option>
              <option value="healthy">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="sm-empty">Loading inventory...</div>
        ) : filteredMedicines.length === 0 ? (
          <div className="sm-empty">
            <Package size={35} />
            <h3>No medicines found</h3>
            <p>
              {medicines.length === 0
                ? "No medicine inventory records available."
                : "Try another search or stock filter."}
            </p>
          </div>
        ) : (
          <div className="sm-card-grid">
            {filteredMedicines.map((item, index) => (
              <StockCard
                key={getMedicineId(item) || index}
                item={item}
                onRestock={openRestock}
              />
            ))}
          </div>
        )}
      </section>

      {selectedMedicine && (
        <div
          className="sm-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeRestock();
            }
          }}
        >
          <section
            className="sm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sm-modal-title"
          >
            <div className="sm-modal-header">
              <div>
                <span className="sm-eyebrow">
                  INVENTORY UPDATE
                </span>
                <h2 id="sm-modal-title">Restock Medicine</h2>
                <p>
                  {getMedicineName(selectedMedicine)}
                </p>
              </div>

              <button
                type="button"
                onClick={closeRestock}
                disabled={saving}
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={submitRestock}>
              <div className="sm-current-stock">
                <Package size={20} />
                <span>Current Stock</span>
                <strong>
                  {getStock(selectedMedicine)} units
                </strong>
              </div>

              <label htmlFor="sm-restock-amount">
                Units to Add
              </label>

              <input
                id="sm-restock-amount"
                type="number"
                min="1"
                step="1"
                required
                placeholder="Enter quantity"
                value={restockAmount}
                onChange={(event) =>
                  setRestockAmount(event.target.value)
                }
              />

              <p className="sm-modal-hint">
                Enter the number of additional medicine
                units received.
              </p>

              <div className="sm-modal-actions">
                <button
                  type="button"
                  className="sm-cancel-button"
                  onClick={closeRestock}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="sm-confirm-button"
                  disabled={saving}
                >
                  <Plus size={16} />
                  {saving ? "Updating..." : "Confirm Restock"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
