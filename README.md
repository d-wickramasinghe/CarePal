# CarePal – Medication Schedule and Reminder System

## Project Overview

CarePal is a full-stack medication management application designed to help caregivers organize medication schedules and allow family members to monitor medication adherence and medicine availability.

The application provides medication management, daily dose tracking, weekly adherence reporting, email reminders, and inventory monitoring.

## Key Features

### Caregiver Portal
- Add and manage medication information
- View daily medication schedules
- Mark scheduled doses as Given or Skipped
- Record reasons for skipped doses
- View weekly medication adherence reports
- Monitor medication inventory and low-stock alerts
- Restock medicine inventory

### Family Portal
- View medication progress through a family dashboard
- Review daily medication schedules
- Monitor weekly adherence reports
- View medicine inventory and stock warnings
- Access a read-only user interface

### Automated Reminders
- Scheduled email reminders for medication times
- Timezone-aware reminder scheduling
- Reminder logging to reduce duplicate notifications

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Vite, CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Email | Nodemailer |
| Scheduling | node-cron |
| Development | VS Code, npm |

## Project Structure

```text
CarePal/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── ...
│   └── package.json
├── backend/
│   ├── server.js
│   ├── .env.example
│   └── package.json
└── README.md
```

## Installation

### Prerequisites

- Node.js and npm
- MongoDB Atlas database
- Valid MongoDB connection string
- Email account credentials for reminder functionality

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file using the project's environment variable template.

Configure the MongoDB connection, server port, and email settings according to the backend implementation.

Start the backend:

```bash
npm run dev
```

### Frontend Setup

Open a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite, typically:

`http://localhost:5173`

## Application Workflow

1. Select Caregiver or Family Member from the role selection interface.
2. Caregivers add medication information and configure schedules.
3. Scheduled medication doses appear in the Daily Schedule.
4. Caregivers record Given or Skipped statuses.
5. Adherence reports summarize recorded medication outcomes.
6. Inventory monitoring highlights medicines that may need restocking.
7. Family members review medication progress through read-only interfaces.

## API Overview

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/medicines` | Retrieve medications |
| GET | `/api/schedule/:date` | Retrieve daily schedule |
| POST | `/api/schedule/status/update` | Update dose status |
| GET | `/api/dashboard/weekly` | Retrieve weekly adherence |
| GET | `/api/stock` | Retrieve stock information |
| POST | `/api/stock/:medicineId/restock` | Add medicine stock |

Additional endpoints and request formats should be confirmed against the backend routes.

## Important Limitations

- Role selection is a frontend demonstration and does not provide secure user authentication or server-side authorization.
- The application does not currently implement multi-patient management.
- Adherence statistics are based on recorded medication statuses.
- Stock duration estimates depend on the configured medication schedule and stock calculation rules.
- This application is an educational project and is not a substitute for professional medical advice.

## Security Notes

- Do not commit `.env` files, passwords, or database credentials.
- Keep sensitive configuration values in environment variables.
- Restrict MongoDB Atlas network access to trusted IP addresses.
- Implement authentication and backend role authorization before production deployment.

## Project Status

Developed as a full-stack internship assignment.

Final testing and verification should be completed before submission.