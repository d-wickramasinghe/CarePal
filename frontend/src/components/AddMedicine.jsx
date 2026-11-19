
import { useState } from "react";

function AddMedicine({ onAdded }) {
  const [form, setForm] = useState({
    name: "",
    strength: "",
    dose: "",
    times: ["08:00"],
    food: "after",
    startDate: "",
    endDate: "",
    stock: 30,
    lowStockDays: 5,
  });

  const [message, setMessage] = useState("");

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/medicines",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save");
      }

      setMessage("Medicine added successfully!");
      onAdded();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <form onSubmit={submit} className="medicine-form">
      <h2>Add Medicine</h2>

      <label>Medicine Name</label>
      <input required value={form.name}
        onChange={(e) => update("name", e.target.value)} />

      <label>Strength</label>
      <input required placeholder="e.g. 500mg"
        value={form.strength}
        onChange={(e) => update("strength", e.target.value)} />

      <label>Dose</label>
      <input required placeholder="e.g. 1 tablet"
        value={form.dose}
        onChange={(e) => update("dose", e.target.value)} />

      <label>Medicine Times</label>
      {form.times.map((time, index) => (
        <div key={index} className="time-row">
          <input type="time" required value={time}
            onChange={(e) => {
              const times = [...form.times];
              times[index] = e.target.value;
              update("times", times);
            }} />
          <button type="button" disabled={form.times.length === 1}
            onClick={() => update("times",
              form.times.filter((_, i) => i !== index))}>
            Remove
          </button>
        </div>
      ))}

      <button type="button"
        onClick={() => update("times", [...form.times, "20:00"])}>
        + Add Time
      </button>

      <label>Food Instructions</label>
      <select value={form.food}
        onChange={(e) => update("food", e.target.value)}>
        <option value="before">Before Food</option>
        <option value="after">After Food</option>
        <option value="any">Any Time</option>
      </select>

      <label>Start Date</label>
      <input type="date" required value={form.startDate}
        onChange={(e) => update("startDate", e.target.value)} />

      <label>End Date</label>
      <input type="date" required min={form.startDate}
        value={form.endDate}
        onChange={(e) => update("endDate", e.target.value)} />

      <label>Stock (tablets/units)</label>
      <input type="number" min="0" required value={form.stock}
        onChange={(e) => update("stock", Number(e.target.value))} />

      <label>Low Stock Warning (days)</label>
      <input type="number" min="1" required
        value={form.lowStockDays}
        onChange={(e) => update("lowStockDays", Number(e.target.value))} />

      <button type="submit" className="save-btn">
        Save Medicine
      </button>

      {message && <p role="status">{message}</p>}
    </form>
  );
}

export default AddMedicine;
