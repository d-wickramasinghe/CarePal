
import { useState } from "react";
import { Image, Upload, X } from "lucide-react";

function AddMedicine({ medicine, onAdded }) {
  const [form, setForm] = useState(() => medicine ? {
    name: medicine.name || "",
    strength: medicine.strength || "",
    dose: medicine.dose || "",
    times: medicine.times?.length ? [...medicine.times] : ["08:00"],
    food: medicine.food || "after",
    startDate: medicine.startDate || "",
    endDate: medicine.endDate || "",
    stock: medicine.stock ?? 30,
    lowStockDays: medicine.lowStockDays ?? 5,
  } : {
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
  const [prescription, setPrescription] = useState(null);
  const [removePrescription, setRemovePrescription] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  function selectPrescription(event) {
    const file = event.target.files?.[0];
    setMessage("");

    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];

    if (!allowed.includes(file.type)) {
      setMessage("Prescription must be JPG, PNG, or WEBP.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Prescription image must be 5MB or smaller.");
      event.target.value = "";
      return;
    }

    setPrescription(file);
    setRemovePrescription(false);

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function removeSelectedPrescription() {
    setPrescription(null);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }

    setRemovePrescription(true);
  }

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        formData.append(
          key,
          key === "times" ? JSON.stringify(value) : String(value)
        );
      });

      if (prescription) {
        formData.append("prescription", prescription);
      }

      if (removePrescription) {
        formData.append("removePrescription", "true");
      }

      const response = await fetch(
        medicine
          ? `http://localhost:5000/api/medicines/${medicine._id}`
          : "http://localhost:5000/api/medicines",
        {
          method: medicine ? "PUT" : "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save");
      }

      setMessage(medicine ? "Medicine updated successfully!" : "Medicine added successfully!");
      onAdded();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <form onSubmit={submit} className="medicine-form">
      <h2>{medicine ? "Edit Medicine" : "Add Medicine"}</h2>

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

      <label>Prescription Photo</label>
      <div className="mm-prescription-upload">
        <input
          id="prescription-upload"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={selectPrescription}
        />

        {previewUrl ? (
          <div className="mm-prescription-preview">
            <img src={previewUrl} alt="Prescription preview" />
            <button type="button" onClick={removeSelectedPrescription}>
              <X size={14} /> Remove
            </button>
          </div>
        ) : medicine?.prescription?.filename && !removePrescription ? (
          <div className="mm-prescription-existing">
            <Image size={18} />
            <span>{medicine.prescription.filename}</span>
            <button type="button" onClick={removeSelectedPrescription}>
              <X size={14} /> Remove
            </button>
          </div>
        ) : (
          <label
            className="mm-prescription-choose"
            htmlFor="prescription-upload"
          >
            <Upload size={18} />
            <span>Choose Image</span>
            <small>JPG, PNG, WEBP · Maximum 5MB</small>
          </label>
        )}
      </div>

      <button type="submit" className="save-btn">
        {medicine ? "Update Medicine" : "Save Medicine"}
      </button>

      {message && <p role="status">{message}</p>}
    </form>
  );
}

export default AddMedicine;
