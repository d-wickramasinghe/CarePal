
import { useEffect, useState } from "react";

const API = "http://localhost:5000/api";

export default function FamilyStock() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadStock() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/stock`);

      if (!response.ok) {
        throw new Error("Unable to load stock details");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStock();
  }, []);

  return (
    <div className="cp-readonly-page">
      <div className="cp-content-heading">
        <div>
          <h2>Medicine Stock Overview</h2>
          <p>
            Monitor medicine availability and alerts.
          </p>
        </div>

        <span className="cp-readonly-badge">
          View Only
        </span>
      </div>

      <div className="cp-stock-summary">
        <div className="cp-panel">
          <p>Total Medicines</p>
          <h2>
            {data?.summary?.totalMedicines ?? "—"}
          </h2>
        </div>

        <div className="cp-panel">
          <p>Low Stock Alerts</p>
          <h2>
            {data?.summary?.lowStockCount ?? "—"}
          </h2>
        </div>
      </div>

      <button
        type="button"
        className="cp-outline-button"
        onClick={loadStock}
      >
        ↻ Refresh Stock
      </button>

      {error && (
        <p className="cp-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="cp-empty">Loading stock...</p>
      ) : (
        <div className="cp-family-stock-grid">
          {data?.medicines?.map((medicine) => (
            <div
              key={medicine.medicineId}
              className="cp-panel cp-family-stock-card"
            >
              <div className="cp-stock-card-heading">
                <h3>{medicine.name}</h3>

                <span
                  className={`cp-status cp-status-${medicine.status}`}
                >
                  {medicine.status.replaceAll("_", " ")}
                </span>
              </div>

              <p>
                <strong>Strength:</strong>{" "}
                {medicine.strength}
              </p>

              <p>
                <strong>Remaining:</strong>{" "}
                {medicine.stock} units
              </p>

              <p>
                <strong>Daily Usage:</strong>{" "}
                {medicine.dailyUsage ?? "Unknown"}
              </p>

              <p>
                <strong>Days Remaining:</strong>{" "}
                {medicine.daysRemaining ?? "Unknown"}
              </p>

              <div className="cp-stock-message">
                {medicine.message}
              </div>
            </div>
          ))}

          {data?.medicines?.length === 0 && (
            <p className="cp-empty">
              No medicines available.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
