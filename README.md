# Cyberpulse

Cyberpulse is a cybersecurity monitoring and detection dashboard built with React, Vite, and Tailwind CSS.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

## Local demo data

This repository is self-contained and does not require a hosted backend or API keys. Demo data, alerts, detection rules, and accounts are stored in your browser with `localStorage`.

To register, enter an email/password and use **123456** as the local demo verification code.

Google sign-in and real email delivery are intentionally not included in this standalone portfolio version. For a production deployment, replace the local compatibility layer in `src/api/base44Client.js` with a secure server/API and database.

## Build

```bash
npm run build
npm run preview
```
