import WorkspaceErrorBoundary from "./components/ui/WorkspaceErrorBoundary";
import { lazy, Suspense } from "react";
import { LoadingState } from "./components/ui/StatePanel";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login.jsx";
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
import ProtectedRoute from "./components/ProtectedRoute.jsx";
function App() {
  return (
    <WorkspaceErrorBoundary><Suspense fallback={<LoadingState label="Opening workspace..." />}><Routes>
      <Route path="/" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance-leaves"
        element={
          <ProtectedRoute allowedRoles={["Finance"]}>
            <Dashboard initialPage="financeLeaves" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/finance-reimbursements"
        element={
          <ProtectedRoute allowedRoles={["Finance"]}>
            <Dashboard initialPage="financeReimbursements" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leave-calendar"
        element={
          <ProtectedRoute allowedRoles={["Admin", "Manager", "HR", "Finance"]}>
            <Dashboard initialPage="leaveCalendar" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/edit-profile"
        element={
          <ProtectedRoute>
            <Dashboard initialPage="editProfile" />
          </ProtectedRoute>
        }
      />
    </Routes></Suspense></WorkspaceErrorBoundary>
  );
}

export default App;
