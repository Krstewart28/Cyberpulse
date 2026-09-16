# 🛡️ Cyberpulse

**Cyberpulse** is an interactive cybersecurity monitoring and threat-detection dashboard built with **React, Vite, and Tailwind CSS**.

The project simulates a modern security operations environment where users can monitor security events, review generated alerts, manage detection rules, and explore cybersecurity data through an interactive dashboard.

Cyberpulse is designed as a **self-contained portfolio project** and can run entirely on your local machine without requiring external API keys or a hosted backend.

## ✨ Features

* 📊 Interactive cybersecurity dashboard
* 🚨 Security alert monitoring
* 🔍 Detailed alert investigation
* 🛡️ Custom detection rules
* ⚡ Security event simulation
* 📈 Risk and severity scoring
* 🔐 Local authentication system
* 💾 Persistent browser-based demo data
* 📱 Responsive user interface
* 🎨 Modern interface built with Tailwind CSS

## 🛠️ Built With

* **React** — Component-based frontend development
* **Vite** — Fast development and build tooling
* **Tailwind CSS** — Responsive interface styling
* **JavaScript / JSX** — Application logic and components
* **localStorage** — Local persistence for accounts, alerts, rules, and simulation data

## 🚀 Running Cyberpulse Locally

### 1. Clone the repository

```bash
git clone https://github.com/Krstewart28/Cyberpulse.git
```

### 2. Open the project

```bash
cd Cyberpulse
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

Open the application at:

```text
http://localhost:3000/
```

## 🔐 Demo Authentication

Cyberpulse includes a local authentication system for demonstration purposes.

You can create an account using an email address and password. When prompted for the verification code, enter:

```text
123456
```

Accounts and authentication information used by the demo are stored locally in the browser.

> **Note:** This authentication system is intended for portfolio and demonstration purposes only. It should not be used as a production authentication system.

## 💾 Local Demo Data

Cyberpulse is completely self-contained and does not require a hosted backend, external database, or API keys.

Demo information such as security events, alerts, detection rules, and account data is stored using the browser's `localStorage`.

This makes it possible to clone the repository and explore the application immediately without configuring additional services.

Because the data is stored locally, information is specific to the browser and device being used.

## 🧪 Security Simulation

Cyberpulse includes simulated cybersecurity activity that allows users to explore how a monitoring and detection platform could respond to different security events.

The simulation system can generate events that are processed by the application's detection and risk-scoring logic. Matching activity can then be surfaced through the dashboard and alert-monitoring interface.

All generated events are fictional and intended for educational and demonstration purposes.

## 🏗️ Production Considerations

The current version of Cyberpulse is designed as a standalone portfolio application.

Features such as Google authentication, real email verification, cloud databases, and production authentication are intentionally not included.

A production version could replace the local data and authentication layer with:

* A secure backend API
* Server-side authentication
* A SQL or NoSQL database
* Secure password hashing
* Email verification services
* Role-based access control
* Cloud deployment and centralized event storage

The frontend architecture can then communicate with those services instead of relying on browser storage.

## 📦 Production Build

Create an optimized production build with:

```bash
npm run build
```

Preview the production build locally with:

```bash
npm run preview
```

## 📁 Project Structure

```text
Cyberpulse/
├── src/
│   ├── api/
│   ├── components/
│   │   └── ui/
│   ├── hooks/
│   ├── lib/
│   │   └── simulation/
│   ├── pages/
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

## 🎯 Project Purpose

Cyberpulse was created to explore the development of cybersecurity-focused web applications while combining frontend development, security concepts, event processing, detection logic, and interactive data visualization.

The project demonstrates practical experience with React application architecture, reusable components, client-side state and data management, cybersecurity monitoring concepts, and modern web development tools.

## ⚠️ Disclaimer

Cyberpulse is an educational and portfolio project.

The security events, alerts, users, organizations, IP addresses, and other simulation data used by the application are fictional and are not intended to represent real systems or security incidents.


