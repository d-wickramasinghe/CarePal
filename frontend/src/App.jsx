
import { useEffect, useState } from "react";
import {
  Bell,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";

import Sidebar from "./components/Sidebar";
import RoleSelection from "./components/RoleSelection";
import DashboardHome from "./components/DashboardHome";

import MedicineManagement from "./components/MedicineManagement";
import DailyScheduleProfessional from "./components/DailyScheduleProfessional";
import AdherenceReportsProfessional from "./components/AdherenceReportsProfessional";
import StockManagementProfessional from "./components/StockManagementProfessional";
import HandoverNotes from "./components/HandoverNotes";

import FamilySchedule from "./components/FamilySchedule";
import FamilyStock from "./components/FamilyStock";
import FamilyPortalDashboard from "./components/FamilyPortalDashboard";
import FamilyScheduleProfessional from "./components/FamilyScheduleProfessional";
import FamilyStockProfessional from "./components/FamilyStockProfessional";

import "./App.css";
import "./RoleDashboard.css";
import "./MedicalTheme.css";
import "./CarePalLayout.css";
import "./DashboardProfessional.css";


const API = "http://localhost:5000/api";

const pageDetails = {
  overview: {
    title: "Dashboard",
    subtitle: "Your medication care overview",
  },
  medicines: {
    title: "Medicine Management",
    subtitle: "Manage medications and schedules",
  },
  schedule: {
    title: "Daily Schedule",
    subtitle: "Track scheduled medication doses",
  },
  family: {
    title: "Adherence Reports",
    subtitle: "Review medication progress",
  },
  stock: {
    title: "Stock Management",
    subtitle: "Monitor medication availability",
  },
  handover: {
    title: "Handover Notes",
    subtitle: "Shift communication and care updates",
  },
};

export default function App() {
  const [role, setRole] = useState(() => {
    const saved = sessionStorage.getItem("carepal_role");

    return ["caregiver", "family"].includes(saved)
      ? saved
      : null;
  });

  const [activePage, setActivePage] = useState("overview");
  const [medicines, setMedicines] = useState([]);
  const [error, setError] = useState("");

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);
  const [notificationsOpen, setNotificationsOpen] =
    useState(false);
  const [notifications, setNotifications] =
    useState([]);
  const [readNotificationIds, setReadNotificationIds] =
    useState(() => {
      try {
        const saved = localStorage.getItem(
          "carepal_read_notifications"
        );
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    });

  async function loadMedicines() {
    try {
      const response = await fetch(`${API}/medicines`);

      if (!response.ok) {
        throw new Error("Unable to load medicines");
      }

      const result = await response.json();

      setMedicines(
        Array.isArray(result)
          ? result
          : result.medicines || []
      );

      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (role) {
      loadMedicines();
    }
  }, [role]);

  useEffect(() => {
    if (!isCaregiverForNotification(role)) return;

    function todayInSriLanka() {
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Colombo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(new Date());
      const date = Object.fromEntries(
        parts.map((part) => [part.type, part.value])
      );
      return `${date.year}-${date.month}-${date.day}`;
    }

    async function loadNotifications() {
      try {
        const response = await fetch(
          `${API}/dashboard/notifications?date=${todayInSriLanka()}`
        );
        if (!response.ok) return;

        const data = await response.json();
        const items = Array.isArray(data.notifications)
          ? data.notifications
          : [];

        setNotifications(
          items.map((item) => ({
            ...item,
            read: readNotificationIds.includes(item.id),
          }))
        );
      } catch {
        setNotifications([]);
      }
    }

    loadNotifications();
    const interval = window.setInterval(
      loadNotifications,
      60000
    );

    return () => window.clearInterval(interval);
  }, [role]);

  function isCaregiverForNotification(userRole) {
    return userRole === "caregiver";
  }

  function persistReadNotificationIds(ids) {
    setReadNotificationIds(ids);
    localStorage.setItem(
      "carepal_read_notifications",
      JSON.stringify(ids)
    );
  }

  function markAllNotificationsRead() {
    const ids = notifications.map(
      (notification) => notification.id
    );
    persistReadNotificationIds(ids);
    setNotifications((items) =>
      items.map((item) => ({ ...item, read: true }))
    );
  }

  function markNotificationRead(notificationId) {
    const ids = Array.from(
      new Set([...readNotificationIds, notificationId])
    );
    persistReadNotificationIds(ids);
    setNotifications((items) =>
      items.map((item) =>
        item.id === notificationId
          ? { ...item, read: true }
          : item
      )
    );
  }

  function selectRole(selectedRole) {
    sessionStorage.setItem(
      "carepal_role",
      selectedRole
    );

    setRole(selectedRole);
    setActivePage("overview");
    setMobileMenuOpen(false);
  }

  function switchRole() {
    sessionStorage.removeItem("carepal_role");

    setRole(null);
    setActivePage("overview");
    setMedicines([]);
    setMobileMenuOpen(false);
    setError("");
  }

  function navigateTo(page) {
    setActivePage(page);
    setMobileMenuOpen(false);
  }

  if (!role) {
    return <RoleSelection onSelectRole={selectRole} />;
  }

  const isCaregiver = role === "caregiver";
  const currentPage = pageDetails[activePage] || pageDetails.overview;

  return (
    <div
      className={`carepal-shell ${
        sidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
    >
      {mobileMenuOpen && (
        <button
          type="button"
          className="carepal-mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div
        className={`carepal-sidebar-container ${
          mobileMenuOpen ? "mobile-open" : ""
        }`}
      >
        <div className="carepal-mobile-close">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <Sidebar
          role={role}
          activePage={activePage}
          onNavigate={navigateTo}
          onSwitchRole={switchRole}
          collapsed={sidebarCollapsed}
        />
      </div>

      <div className="carepal-main-container">
        <header className="carepal-topbar">
          <div className="carepal-topbar-left">
            <button
              type="button"
              className="carepal-menu-button carepal-mobile-menu"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>

            <button
              type="button"
              className="carepal-menu-button carepal-desktop-menu"
              onClick={() =>
                setSidebarCollapsed((value) => !value)
              }
              aria-label={
                sidebarCollapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
              }
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen size={20} />
              ) : (
                <PanelLeftClose size={20} />
              )}
            </button>

            <div className="carepal-page-heading">
              <span>
                {isCaregiver
                  ? "Caregiver Workspace"
                  : "Family Care Portal"}
              </span>

              <h1>{currentPage.title}</h1>
              <p>{currentPage.subtitle}</p>
            </div>
          </div>

          <div className="carepal-topbar-right">
            <div className="carepal-role-pill">
              <span className="carepal-status-dot" />
              {isCaregiver ? "Caregiver" : "Family"}
            </div>

            {isCaregiver && (
              <div className="carepal-notification-container">
                <button
                  type="button"
                  className="carepal-notification-icon"
                  aria-label="Notifications"
                  aria-expanded={notificationsOpen}
                  onClick={() =>
                    setNotificationsOpen((open) => !open)
                  }
                >
                  <Bell size={19} />
                  {notifications.filter(
                    (notification) => !notification.read
                  ).length > 0 && (
                    <span className="carepal-notification-badge">
                      {
                        notifications.filter(
                          (notification) => !notification.read
                        ).length
                      }
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="carepal-notification-dropdown">
                    <div className="carepal-notification-heading">
                      <h3>Notifications</h3>
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        disabled={
                          notifications.every(
                            (notification) =>
                              notification.read
                          )
                        }
                      >
                        Mark all read
                      </button>
                    </div>

                    <div className="carepal-notification-list">
                      {notifications.length === 0 ? (
                        <div className="carepal-notification-empty">
                          No notifications at this time.
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <button
                            type="button"
                            className={`carepal-notification-item ${
                              notification.read ? "read" : "unread"
                            }`}
                            key={notification.id}
                            onClick={() =>
                              markNotificationRead(
                                notification.id
                              )
                            }
                          >
                            <span
                              className={`carepal-notification-type carepal-notification-${notification.category}`}
                            >
                              {notification.category === "stock"
                                ? "Low Stock"
                                : notification.category === "missed"
                                ? "Missed Dose"
                                : "Upcoming Dose"}
                            </span>
                            <strong>
                              {notification.title}
                            </strong>
                            <p>{notification.message}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="carepal-profile">
              <div className="carepal-avatar">
                {isCaregiver ? "CG" : "FM"}
              </div>

              <div className="carepal-profile-text">
                <strong>
                  {isCaregiver
                    ? "Caregiver"
                    : "Family Member"}
                </strong>
                <span>CarePal Workspace</span>
              </div>
            </div>
          </div>
        </header>

        <main className="carepal-page-scroll">
          <div className="carepal-page-inner">
            {error && (
              <div className="carepal-error" role="alert">
                {error}
              </div>
            )}

            {activePage === "overview" &&
  (isCaregiver ? (
    <DashboardHome
      role={role}
      medicines={medicines}
      onNavigate={setActivePage}
    />
  ) : (
    <FamilyPortalDashboard onNavigate={setActivePage} />
  ))}

            {activePage === "medicines" && isCaregiver && (
  <MedicineManagement
    medicines={medicines}
    onAdded={loadMedicines}
  />
)}

            {activePage === "schedule" &&
  (isCaregiver ? (
    <DailyScheduleProfessional />
  ) : (
    <FamilyScheduleProfessional />
  ))}

            {activePage === "family" && (
  <AdherenceReportsProfessional />
)}

            {activePage === "stock" &&
  (isCaregiver ? (
    <StockManagementProfessional />
  ) : (
    <FamilyStockProfessional />
  ))}
            {activePage === "handover" && isCaregiver && (
              <HandoverNotes />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
