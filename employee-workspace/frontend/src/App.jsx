import { Routes, Route } from "react-router-dom";
import FinanceLeaves from "./pages/FinanceLeaves";
import FinanceReimbursements from "./pages/FinanceReimbursements";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import LeaveCalendar from "./pages/LeaveCalendar";
import EditProfile from "./pages/EditProfile.jsx";
function App() {
  return (
    <Routes>
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
            <FinanceLeaves />
          </ProtectedRoute>
        }
      />

      <Route
        path="/finance-reimbursements"
        element={
          <ProtectedRoute allowedRoles={["Finance"]}>
            <FinanceReimbursements />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leave-calendar"
        element={
          <ProtectedRoute allowedRoles={["Admin", "Manager", "HR", "Finance"]}>
            <LeaveCalendar />
          </ProtectedRoute>
        }
      />
      <Route
        path="/edit-profile"
        element={
          <ProtectedRoute>
            <EditProfile />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
