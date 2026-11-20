import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeftRight,
  CheckCircle2,
  Clock3,
  MessageSquareText,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";

import "../HandoverNotes.css";

const API = "http://localhost:5000/api/handover-notes";

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-US", {
    timeZone: "Asia/Colombo",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function HandoverNotes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [shift, setShift] = useState("day-night");
  const [category, setCategory] = useState("medication");
  const [note, setNote] = useState("");

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API);
      if (!response.ok) throw new Error("Unable to load handover notes.");
      const data = await response.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  async function createNote(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shift, category, note }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to create note.");
      }

      setNote("");
      setShowForm(false);
      await loadNotes();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function acknowledgeNote(id) {
    setError("");

    try {
      const response = await fetch(`${API}/${id}/acknowledge`, {
        method: "PATCH",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to acknowledge note.");
      }
      await loadNotes();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="hn-page">
      <section className="hn-hero">
        <div>
          <span className="hn-eyebrow">SHIFT COMMUNICATION</span>
          <h2>Handover Notes</h2>
          <p>Share important care updates between day and night shifts.</p>
        </div>
        <button type="button" onClick={() => setShowForm(true)}>
          <Plus size={18} />
          New Handover Note
        </button>
      </section>

      {error && <div className="hn-error" role="alert">{error}</div>}

      <section className="hn-panel">
        <div className="hn-panel-heading">
          <div>
            <h3>Recent Handover Notes</h3>
            <p>Latest shift updates and acknowledgements</p>
          </div>
          <button type="button" onClick={loadNotes} disabled={loading}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="hn-empty">Loading handover notes...</div>
        ) : notes.length === 0 ? (
          <div className="hn-empty">
            <MessageSquareText size={34} />
            <h3>No handover notes</h3>
            <p>Create the first shift update.</p>
          </div>
        ) : (
          <div className="hn-list">
            {notes.map((item) => (
              <article className="hn-card" key={item._id}>
                <div className="hn-card-top">
                  <span className="hn-shift">
                    <ArrowLeftRight size={14} />
                    {item.shift === "day-night" ? "Day → Night" : "Night → Day"}
                  </span>
                  <span className="hn-category">
                    {item.category === "patient-condition"
                      ? "Patient Condition"
                      : item.category === "general-care"
                      ? "General Care"
                      : "Medication"}
                  </span>
                </div>

                <p className="hn-note">{item.note}</p>

                <div className="hn-card-footer">
                  <div>
                    <strong>By: {item.caregiverName}</strong>
                    <span>
                      <Clock3 size={13} />
                      {formatDate(item.createdAt)}
                    </span>
                  </div>

                  {item.acknowledged ? (
                    <span className="hn-acknowledged">
                      <CheckCircle2 size={14} />
                      Acknowledged
                      {item.acknowledgedAt
                        ? ` · ${formatDate(item.acknowledgedAt)}`
                        : ""}
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="hn-ack-button"
                      onClick={() => acknowledgeNote(item._id)}
                    >
                      <CheckCircle2 size={15} />
                      Acknowledge
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {showForm && (
        <div className="hn-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowForm(false);
        }}>
          <section className="hn-modal" role="dialog" aria-modal="true">
            <div className="hn-modal-header">
              <div>
                <span className="hn-eyebrow">SHIFT HANDOVER</span>
                <h2>New Handover Note</h2>
              </div>
              <button type="button" onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={createNote}>
              <label>Shift Handover</label>
              <select value={shift} onChange={(event) => setShift(event.target.value)}>
                <option value="day-night">Day → Night</option>
                <option value="night-day">Night → Day</option>
              </select>

              <label>Category</label>
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="medication">Medication</option>
                <option value="patient-condition">Patient Condition</option>
                <option value="general-care">General Care</option>
              </select>

              <label>Handover Note</label>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Share important information for the next caregiver..."
                rows={5}
                maxLength={2000}
                required
              />

              <div className="hn-modal-actions">
                <button type="button" className="hn-cancel" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="hn-save" disabled={saving}>
                  {saving ? "Saving..." : "Save Handover Note"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
