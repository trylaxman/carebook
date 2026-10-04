# Carebook

A mobile-first healthcare booking prototype built with **Next.js App Router**, **TypeScript**, and **SQLite**. Carebook demonstrates the patient journey from finding a doctor to booking and managing appointments, alongside a basic clinic admin workspace.

The interface stays inside a **414px mobile frame centered in the browser** and fills the available width on smaller screens. All clinicians, services, and patient records are fictional demo data.

> **Project status:** Interactive prototype for client demonstrations. Authentication and card payments are simulated; this is not a production healthcare application.

## Features

### Patient experience

- Welcome screen, demo account access, email-only sign-in, and registration.
- Home dashboard with specialties, care team listings, and the next appointment.
- Searchable doctor and service listings with specialty filters.
- Provider details with consultation fees, duration, experience, and clinic information.
- Appointment booking with available dates and time slots.
- Server-side slot conflict checks to prevent duplicate confirmed bookings.
- Optional visit notes and a payment preference: pay at clinic or simulated card payment.
- Booking confirmation with a unique reference and an in-app notification.
- Appointment details, rescheduling, cancellation, and booking history.
- Notifications with a mark-all-read action.
- Editable patient profile and remembered demo account selection.

### Clinic workspace

- Summary counts for bookings, confirmed appointments, patients, and active providers.
- View bookings and change their status.
- Update provider fees and visibility in the patient app.
- View registered demo patients.
- Reset all demo records for a fresh presentation.

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js App Router |
| Interface | React and TypeScript |
| Styling | CSS with a responsive mobile shell |
| Icons | Lucide React |
| API | Next.js Route Handler |
| Persistence | SQLite through Node.js `node:sqlite` |
| Demo account selection | Browser localStorage |

## Getting started

### Requirements

- **Node.js 22.13+**; Node.js 24 recommended.
- npm.
- A writable local filesystem for the SQLite database.

No API keys, environment variables, or separate database installation are required.

### Install and run

From the repository root:

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For an optimized build:

```bash
npm run build
npm start
```

### Demo access

Click **Explore with a demo account**, or sign in using:

```text
alex@example.com
```

No password is required for demo sign-in. You can also register using a new fictional name and email address.

## Demo walkthrough

1. Enter with the demo account.
2. Select a specialty or tap **Find a doctor**.
3. Open a doctor or service and review its details.
4. Tap **Book an appointment**, choose a date and available time, and confirm.
5. View the confirmation and appointment details.
6. Reschedule or cancel the appointment.
7. Open **Visits** to review upcoming, completed, and cancelled bookings.
8. Open **Notifications** to see booking updates.
9. Open **Profile → Personal information** to update patient details.
10. Open **Profile → Clinic workspace** to explore the admin demo.

Use **Reset demo data** in the clinic workspace to restore the original sample records. This removes newly registered demo accounts and appointments.

## Project structure

```text
app/
  layout.tsx                 Root layout and metadata
  page.tsx                   Application entry point
  globals.css                Mobile interface and responsive styles
  api/demo/route.ts          Demo API endpoint
components/
  care-app.tsx               Patient screens and clinic workspace
lib/
  data.ts                   Types, sample records, and slot helpers
  store.ts                  SQLite persistence and transactions
tests/
  api.mjs                   API integration checks
  smoke.cjs                 Optional Playwright UI walkthrough
```

Next.js App Router serves the page and API. Internal app screens use React state and in-app back buttons; they do not currently have individual URLs or browser history navigation.

## Data and scheduling

The database is created automatically at:

```text
data/carebook.sqlite
```

Providers, patients, bookings, and notifications are stored as keyed JSON records in separate SQLite tables. Records persist across server restarts when the database file is retained. Generated database files are excluded from git.

The demo includes four doctors and two clinic services. Appointments can be booked for the next 14 days, with 10 predefined daily slots and 30-minute visits. Dates use the clinic timezone, `America/New_York`.

Rescheduling creates a new appointment and marks the original cancelled. Cancelling releases the slot. Appointment completion is managed from the clinic workspace.

## API overview

`GET /api/demo` returns the shared demo state.

`POST /api/demo` accepts a JSON body with an `action` and the relevant fields:

| Action | Fields |
| --- | --- |
| `login` | `email` |
| `register` | `name`, `email`, optional `phone` |
| `profile` | `patientId`, `name`, `phone`, `dob`, `gender`, `blood`, `allergies` |
| `book` | `patientId`, `doctorId`, `date`, `time`, `payment`, optional `notes`, `rescheduleId` |
| `status` | `id`, `status`: `Confirmed`, `Completed`, or `Cancelled` |
| `read` | `patientId` |
| `provider` | `id`, `fee`, `active` |
| `reset` | No additional fields |

## Testing

Build and TypeScript checks:

```bash
npm run build
npm run typecheck
```

With the app running, execute the API integration suite in a second terminal:

```bash
DEMO_TEST_RESET=yes node tests/api.mjs
```

**The API suite resets demo data.** Run it against a disposable local instance. It covers account registration, sign-in, profiles, invalid slots, simultaneous slot conflicts, rescheduling, appointment status, provider visibility, notifications, and reset.

Optional browser walkthrough:

```bash
npm install --save-dev playwright
npx playwright install chromium
node tests/smoke.cjs
```

Reset the demo before running the browser walkthrough. Screenshots are written to `test-results/`.

The production build and API integration suite passed during initial development. The browser walkthrough is included but was not executed successfully in the creation environment because Chromium could not be downloaded.

## Prototype boundaries

- Sign-in uses email only and does not authenticate a real identity.
- Patient and admin API actions are open for demonstration; there is no role-based access control.
- Card payments are simulated, with no card collection or charges.
- Notifications are in-app only; email, SMS, and push delivery are not connected.
- Scheduling uses predefined daily slots without holiday or provider calendar integrations.
- No medical reports, clinical records, or test results are generated.
- App Store and Google Play releases are outside this web prototype.

Use fictional information only. A production implementation needs authenticated sessions, patient and staff authorization, a production database design, scheduling rules, and the relevant payment and notification integrations.

The current SQLite setup is intended for a single demo server with persistent writable storage. Ephemeral serverless hosting requires a different persistence approach.

## Customization

- **Sample providers and patients:** Edit `lib/data.ts`, then reset demo data.
- **Brand colors and mobile styling:** Edit `app/globals.css`.
- **Screens and interaction flows:** Edit `components/care-app.tsx`.
- **Backend behavior:** Edit `app/api/demo/route.ts` and `lib/store.ts`.
