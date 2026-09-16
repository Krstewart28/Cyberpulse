import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider } from "@/lib/AuthContext";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import { SimulationProvider } from "@/lib/simulation/SimulationContext";

import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";

import Dashboard from "@/pages/Dashboard";
import SecurityEvents from "@/pages/SecurityEvents";
import Alerts from "@/pages/Alerts";
import AlertDetails from "@/pages/AlertDetails";
import DetectionRules from "@/pages/DetectionRules";
import Simulation from "@/pages/Simulation";

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              element={
                <ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />
              }
            >
              <Route
                element={
                  <SimulationProvider>
                    <Layout />
                  </SimulationProvider>
                }
              >
                <Route path="/" element={<Dashboard />} />
                <Route path="/events" element={<SecurityEvents />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/alerts/:alertId" element={<AlertDetails />} />
                <Route path="/rules" element={<DetectionRules />} />
                <Route path="/simulation" element={<Simulation />} />
              </Route>
            </Route>
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;