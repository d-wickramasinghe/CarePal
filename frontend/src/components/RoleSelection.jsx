
import React from "react";

const roles = [
  {
    id: "caregiver",
    icon: "🩺",
    title: "Caregiver",
    subtitle: "Manage daily care",
    description:
      "Manage medicines, record doses, track schedules and monitor stock.",
    features: [
      "Manage medicines",
      "Record Given / Skipped doses",
      "Monitor stock and adherence",
    ],
  },
  {
    id: "family",
    icon: "👨‍👩‍👧",
    title: "Family Member",
    subtitle: "Stay informed",
    description:
      "Monitor medication progress, adherence and medicine availability.",
    features: [
      "View medication schedules",
      "Monitor weekly adherence",
      "View stock alerts",
    ],
  },
];

export default function RoleSelection({ onSelectRole }) {
  return (
    <div className="role-selection-page">
      <div className="role-selection-container">
        <div className="role-brand">
          <div className="role-brand-icon">✚</div>
          <h1>CarePal</h1>
          <p>Compassionate Care, Made Simple.</p>
        </div>

        <div className="role-introduction">
          <span className="eyebrow">WELCOME TO CAREPAL</span>
          <h2>How would you like to continue?</h2>
          <p>
            Select your role to access a dashboard
            designed for your needs.
          </p>
        </div>

        <div className="role-card-grid">
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              className="role-card"
              onClick={() => onSelectRole(role.id)}
            >
              <div className="role-card-icon">
                {role.icon}
              </div>

              <h3>{role.title}</h3>
              <span className="role-subtitle">
                {role.subtitle}
              </span>

              <p>{role.description}</p>

              <div className="role-feature-list">
                {role.features.map((feature) => (
                  <div key={feature}>
                    <span className="role-check">✓</span>
                    {feature}
                  </div>
                ))}
              </div>

              <span className="role-card-action">
                Continue as {role.title} →
              </span>
            </button>
          ))}
        </div>

        <p className="role-footer">
          CarePal Medication Management System
          <br />
          Your care, our priority.
        </p>
      </div>
    </div>
  );
}
