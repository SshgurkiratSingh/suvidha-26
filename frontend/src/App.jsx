import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Pages
import AttractScreen from "./pages/AttractScreen";
import LanguageSelection from "./pages/LanguageSelection";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminApplications from "./pages/AdminApplications";
import AdminGrievances from "./pages/AdminGrievances";
import NotFound from "./pages/NotFound";
import Accessibility from "./pages/Accessibility";
import Profile from "./pages/Profile";

// Service Hubs
import ElectricityHub from "./components/services/electricity/ElectricityHub";
import WaterHub from "./components/services/water/WaterHub";
import GasHub from "./components/services/gas/GasHub";
import SanitationHub from "./components/services/sanitation/SanitationHub";
import SolarHub from "./components/services/solar/SolarHub";

// Electricity Services
import NewConnection from "./components/services/electricity/NewConnection";

// Billing & Payments
import AllBills from "./pages/AllBills";
import AllUsage from "./pages/AllUsage";
import MyApplications from "./pages/MyApplications";

function App() {
  const { user, isAdmin } = useAuth();

  const Protected = (Component) =>
    user ? <Component /> : <Navigate to="/login" replace />;
  const ProtectedAdmin = (Component) =>
    isAdmin ? <Component /> : <Navigate to="/admin/login" replace />;

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<AttractScreen />} />
        <Route path="/language" element={<LanguageSelection />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/accessibility" element={<Accessibility />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={Protected(Dashboard)} />
        <Route path="/profile" element={Protected(Profile)} />
        <Route
          path="/admin/dashboard"
          element={ProtectedAdmin(AdminDashboard)}
        />
        <Route
          path="/admin/applications"
          element={ProtectedAdmin(AdminApplications)}
        />
        <Route
          path="/admin/grievances"
          element={ProtectedAdmin(AdminGrievances)}
        />

        {/* ================= ELECTRICITY ROUTES ================= */}
        <Route path="/electricity">
          <Route index element={Protected(ElectricityHub)} />
          <Route path="new-connection" element={Protected(NewConnection)} />
        </Route>

        {/* ================= OTHER SERVICE HUBS ================= */}
        <Route path="/water" element={Protected(WaterHub)} />
        <Route path="/gas" element={Protected(GasHub)} />
        <Route path="/sanitation" element={Protected(SanitationHub)} />
        <Route path="/solar" element={Protected(SolarHub)} />

        {/* Billing */}
        <Route path="/all-bills" element={Protected(AllBills)} />
        <Route path="/all-usage" element={Protected(AllUsage)} />
        <Route path="/my-applications" element={Protected(MyApplications)} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
