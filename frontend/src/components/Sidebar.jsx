
import React from "react";

const caregiverMenu = [
  { id: "overview", icon: "⌂", label: "Dashboard" },
  { id: "medicines", icon: "✚", label: "Medicines" },
  { id: "schedule", icon: "▤", label: "Daily Schedule" },
  { id: "family", icon: "▥", label: "Adherence Reports" },
  { id: "stock", icon: "◫", label: "Stock Management" },
];

const familyMenu = [
  { id: "overview", icon: "⌂", label: "Dashboard" },
  { id: "schedule", icon: "▤", label: "Medicine Schedule" },
  { id: "family", icon: "▥", label: "Adherence Reports" },
  { id: "stock", icon: "◫", label: "Stock Overview" },
];

export default function Sidebar({
  role,
  activePage,
  onNavigate,
  onSwitchRole,
}) {
  const menu =
    role === "caregiver" ? caregiverMenu : familyMenu;

  return (
    <aside className="medical-sidebar">
      <div className="medical-logo">
        <div className="medical-logo-icon">✚</div>
        <div>
          <h2>CarePal</h2>
          <span>Medication Management</span>
        </div>
      </div>

      <div className="medical-workspace-label">
        WORKSPACE
      </div>

      <nav
        className="medical-nav"
        aria-label="Main navigation"
      >
        {menu.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`medical-nav-item ${
              activePage === item.id ? "active" : ""
            }`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="medical-nav-icon">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="medical-sidebar-bottom">
        <div className="medical-help-card">
          <div className="medical-help-icon">♡</div>
          <strong>Care made simple</strong>
          <p>
            Supporting healthier routines,
            one dose at a time.
          </p>
        </div>

        <button
          type="button"
          className="medical-switch-role"
          onClick={onSwitchRole}
        >
          ⇄ Switch Role
        </button>

        <div className="medical-sidebar-profile">
          <div className="medical-profile-avatar">
            {role === "caregiver" ? "CG" : "FM"}
          </div>

          <div>
            <strong>
              {role === "caregiver"
                ? "Caregiver"
                : "Family Member"}
            </strong>
            <span>Demo Account</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
