
import { useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Package,
  Pill,
  Plus,
  Search,
  SlidersHorizontal,
  Utensils,
  AlertTriangle,
  CheckCircle2,
  X,
  Pencil,
  Trash2,
  Eye,
  FileImage,
} from "lucide-react";

import AddMedicine from "./AddMedicine";
import "../MedicineManagement.css";

function getStockStatus(medicine) {
  const stock = Number(medicine.stock ?? 0);

  if (stock <= 0) {
    return "out";
  }

  const timesPerDay = medicine.times?.length || 1;
  const daysRemaining = stock / timesPerDay;
  const threshold = Number(medicine.lowStockDays ?? 3);

  return daysRemaining <= threshold ? "low" : "healthy";
}

function MedicineCard({ medicine, onEdit, onDelete, onViewPrescription }) {
  const stockStatus = getStockStatus(medicine);

  const statusText = {
    healthy: "In Stock",
    low: "Low Stock",
    out: "Out of Stock",
  };

  return (
    <article className="mm-card">
      <div className="mm-card-header">
        <div className="mm-card-icon">
          <Pill size={23} />
        </div>

        <span className={`mm-status mm-status-${stockStatus}`}>
          {stockStatus === "healthy" ? (
            <CheckCircle2 size={13} />
          ) : (
            <AlertTriangle size={13} />
          )}
          {statusText[stockStatus]}
        </span>
      </div>

      <h3>{medicine.name}</h3>

      <p className="mm-card-subtitle">
        {[medicine.strength, medicine.dose]
          .filter(Boolean)
          .join(" · ") || "Medication"}
      </p>

      <div className="mm-card-info">
        <div>
          <Clock3 size={16} />
          <span>Schedule</span>
          <strong>
            {medicine.times?.length
              ? medicine.times.join(", ")
              : "Not set"}
          </strong>
        </div>

        <div>
          <Utensils size={16} />
          <span>Food</span>
          <strong>{medicine.food || "Not specified"}</strong>
        </div>

        <div>
          <Package size={16} />
          <span>Available Stock</span>
          <strong>{medicine.stock ?? 0} units</strong>
        </div>

        <div>
          <CalendarDays size={16} />
          <span>Start Date</span>
          <strong>{medicine.startDate || "—"}</strong>
        </div>

        <div>
          <CalendarDays size={16} />
          <span>End Date</span>
          <strong>{medicine.endDate || "—"}</strong>
        </div>
      </div>

      {medicine.prescription?.filename && (
        <div className="mm-prescription-card">
          <span>
            <FileImage size={16} />
            <span>
              <small>Prescription attached</small>
              <strong>{medicine.prescription.filename}</strong>
            </span>
          </span>
          <button
            type="button"
            onClick={() => onViewPrescription(medicine)}
          >
            <Eye size={14} />
            View
          </button>
        </div>
      )}

      <div className="mm-card-footer">
        <span className="mm-card-actions">
          <button type="button" className="mm-edit-button" onClick={() => onEdit(medicine)}>
            <Pencil size={15} />
            Edit
          </button>
          <button type="button" className="mm-delete-button" onClick={() => onDelete(medicine)}>
            <Trash2 size={15} />
            Delete
          </button>
        </span>
        <span className="mm-card-footer-dot" aria-hidden="true" />
      </div>
    </article>
  );
}

export default function MedicineManagement({
  medicines = [],
  onAdded,
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [deletingMedicine, setDeletingMedicine] = useState(null);
  const [actionError, setActionError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [prescriptionMedicine, setPrescriptionMedicine] =
    useState(null);

  const stats = useMemo(() => {
    const lowStock = medicines.filter(
      (medicine) => getStockStatus(medicine) !== "healthy"
    ).length;

    const totalUnits = medicines.reduce(
      (total, medicine) =>
        total + (Number(medicine.stock) || 0),
      0
    );

    return {
      total: medicines.length,
      lowStock,
      totalUnits,
    };
  }, [medicines]);

  const filteredMedicines = useMemo(() => {
    const query = search.trim().toLowerCase();

    return medicines.filter((medicine) => {
      const matchesSearch = [
        medicine.name,
        medicine.strength,
        medicine.dose,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query)
        );

      const status = getStockStatus(medicine);

      const matchesFilter =
        filter === "all" ||
        (filter === "low" && status !== "healthy") ||
        (filter === "healthy" && status === "healthy");

      return matchesSearch && matchesFilter;
    });
  }, [medicines, search, filter]);

  async function handleAdded() {
    await onAdded?.();
    setShowForm(false);
    setEditingMedicine(null);
  }

  function openEdit(medicine) {
    setActionError("");
    setEditingMedicine(medicine);
    setShowForm(true);
  }

  async function confirmDelete() {
    if (!deletingMedicine) return;

    setIsDeleting(true);
    setActionError("");

    try {
      const response = await fetch(
        `http://localhost:5000/api/medicines/${deletingMedicine._id}`,
        { method: "DELETE" }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete medicine");
      }

      await onAdded?.();
      setDeletingMedicine(null);
    } catch (error) {
      setActionError(error.message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="mm-page">
      <section className="mm-hero">
        <div>
          <span className="mm-eyebrow">
            MEDICATION MANAGEMENT
          </span>

          <h2>Manage medications with confidence.</h2>

          <p>
            Keep medicine information, dosage schedules,
            and stock details organized in one place.
          </p>

          <button
            type="button"
            className="mm-primary-button"
            onClick={() => setShowForm(true)}
          >
            <Plus size={18} />
            Add New Medicine
          </button>
        </div>

        <img
          src="../../public/medicine-illustration.png"
          alt="Medication management"
        />
      </section>

      <div className="mm-stats">
        <div className="mm-stat-card">
          <span className="mm-stat-icon mm-stat-teal">
            <Pill size={21} />
          </span>
          <div>
            <p>Total Medicines</p>
            <strong>{stats.total}</strong>
            <small>Registered medicines</small>
          </div>
        </div>

        <div className="mm-stat-card">
          <span className="mm-stat-icon mm-stat-orange">
            <AlertTriangle size={21} />
          </span>
          <div>
            <p>Stock Warnings</p>
            <strong>{stats.lowStock}</strong>
            <small>Need attention</small>
          </div>
        </div>

        <div className="mm-stat-card">
          <span className="mm-stat-icon mm-stat-blue">
            <Package size={21} />
          </span>
          <div>
            <p>Total Stock Units</p>
            <strong>{stats.totalUnits}</strong>
            <small>Across all medicines</small>
          </div>
        </div>
      </div>

      <section className="mm-list-panel">
        <div className="mm-section-heading">
          <div>
            <h3>Registered Medicines</h3>
            <p>
              Browse and review medication records
            </p>
          </div>

          <span className="mm-count">
            {filteredMedicines.length} medicines
          </span>
        </div>

        <div className="mm-toolbar">
          <div className="mm-search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search by medicine name, strength..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <div className="mm-filter">
            <SlidersHorizontal size={17} />
            <select
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value)
              }
              aria-label="Filter medicines"
            >
              <option value="all">All Medicines</option>
              <option value="healthy">In Stock</option>
              <option value="low">Stock Warnings</option>
            </select>
          </div>
        </div>

        {filteredMedicines.length === 0 ? (
          <div className="mm-empty">
            <Pill size={34} />
            <h3>No medicines found</h3>
            <p>
              {medicines.length === 0
                ? "Add your first medicine to get started."
                : "Try another search or filter."}
            </p>
          </div>
        ) : (
          <div className="mm-grid">
            {filteredMedicines.map((medicine) => (
              <MedicineCard
                key={medicine._id}
                medicine={medicine}
                onEdit={openEdit}
                onDelete={(selected) => {
                  setActionError("");
                  setDeletingMedicine(selected);
                }}
                onViewPrescription={setPrescriptionMedicine}
              />
            ))}
          </div>
        )}
      </section>

      {showForm && (
        <div
          className="mm-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowForm(false);
              setEditingMedicine(null);
            }
          }}
        >
          <section
            className="mm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mm-modal-title"
          >
            <div className="mm-modal-header">
              <div>
                <span className="mm-eyebrow">
                  {editingMedicine ? "EDIT MEDICATION" : "NEW MEDICATION"}
                </span>
                <h2 id="mm-modal-title">
                  {editingMedicine ? "Edit Medicine" : "Add Medicine"}
                </h2>
                <p>
                  Update or enter the medication and schedule details.
                </p>
              </div>

              <button
                type="button"
                className="mm-close-button"
                onClick={() => {
                  setShowForm(false);
                  setEditingMedicine(null);
                }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mm-modal-content">
              <AddMedicine
                medicine={editingMedicine}
                onAdded={handleAdded}
              />
            </div>
          </section>
        </div>
      )}

      {prescriptionMedicine && (
        <div
          className="mm-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setPrescriptionMedicine(null);
            }
          }}
        >
          <section
            className="mm-prescription-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Prescription preview"
          >
            <div className="mm-prescription-modal-header">
              <div>
                <span className="mm-eyebrow">PRESCRIPTION</span>
                <h2>{prescriptionMedicine.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setPrescriptionMedicine(null)}
                aria-label="Close prescription"
              >
                <X size={20} />
              </button>
            </div>
            <img
              src={`http://localhost:5000/api/medicines/${prescriptionMedicine._id}/prescription`}
              alt={`Prescription for ${prescriptionMedicine.name}`}
            />
          </section>
        </div>
      )}

      {deletingMedicine && (
        <div
          className="mm-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isDeleting) {
              setDeletingMedicine(null);
            }
          }}
        >
          <section
            className="mm-confirm-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="mm-delete-title"
          >
            <span className="mm-confirm-icon">
              <AlertTriangle size={24} />
            </span>
            <h2 id="mm-delete-title">Delete {deletingMedicine.name}?</h2>
            <p>
              This removes the medicine from schedules and stock.
              Historical dose records will be preserved for reporting.
            </p>
            {actionError && (
              <p className="mm-action-error" role="alert">{actionError}</p>
            )}
            <div className="mm-confirm-actions">
              <button
                type="button"
                className="mm-cancel-button"
                disabled={isDeleting}
                onClick={() => setDeletingMedicine(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="mm-confirm-delete"
                disabled={isDeleting}
                onClick={confirmDelete}
              >
                {isDeleting ? "Deleting..." : "Delete Medicine"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
