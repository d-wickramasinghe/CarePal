
import { useEffect, useState } from "react";

function StockDashboard() {
  const [data, setData] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");

  async function loadStock() {
    try {
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/stock"
      );

      if (!response.ok) {
        throw new Error("Failed to load stock");
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

  async function handleRestock(medicineId) {
    const quantity = Number(quantities[medicineId]);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Enter a valid restock quantity");
      return;
    }

    setSavingId(medicineId);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:5000/api/stock/${medicineId}/restock`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ quantity }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Restock failed");
      }

      setQuantities((prev) => ({
        ...prev,
        [medicineId]: "",
      }));

      await loadStock();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId("");
    }
  }

  return (
    <section className="stock-dashboard">
      <div className="stock-header">
        <div>
          <h2>Medicine Stock Overview</h2>
          <p>Track medicine availability and low stock</p>
        </div>

        <button type="button" onClick={loadStock}>
          Refresh Stock
        </button>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {loading && <p>Loading stock...</p>}

      {data && (
        <>
          <div className="stock-summary">
            <div className="stock-summary-card">
              <p>Total Medicines</p>
              <h3>{data.summary.totalMedicines}</h3>
            </div>

            <div className="stock-summary-card">
              <p>Low Stock Alerts</p>
              <h3>{data.summary.lowStockCount}</h3>
            </div>
          </div>

          <div className="stock-grid">
            {data.medicines.map((medicine) => (
              <div
                className="stock-card"
                key={medicine.medicineId}
              >
                <div className="stock-card-heading">
                  <h3>{medicine.name}</h3>

                  <span
                    className={`stock-badge ${medicine.status}`}
                  >
                    {medicine.status.replaceAll("_", " ")}
                  </span>
                </div>

                <p>
                  <strong>Strength:</strong>{" "}
                  {medicine.strength}
                </p>

                <p>
                  <strong>Remaining Stock:</strong>{" "}
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

                <p className="stock-message">
                  {medicine.message}
                </p>

                <div className="restock-form">
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    placeholder="Quantity to add"
                    value={
                      quantities[medicine.medicineId] ?? ""
                    }
                    onChange={(e) =>
                      setQuantities((prev) => ({
                        ...prev,
                        [medicine.medicineId]:
                          e.target.value,
                      }))
                    }
                  />

                  <button
                    type="button"
                    disabled={
                      savingId === medicine.medicineId
                    }
                    onClick={() =>
                      handleRestock(medicine.medicineId)
                    }
                  >
                    {savingId === medicine.medicineId
                      ? "Saving..."
                      : "Restock"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default StockDashboard;
