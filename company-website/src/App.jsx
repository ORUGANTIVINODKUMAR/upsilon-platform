import { useEffect } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";

import Header from "./components/Header";
import Footer from "./components/Footer";
import StickyContactButton from "./components/StickyContactButton";

import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import Resources from "./pages/Resources";
import ArticlePage from "./pages/ArticlePage";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";

import CareersAbout from "./pages/CareersAbout";
import CareersTheUpsilonWay from "./pages/CareersTheUpsilonWay";
import CareersFakeJobAlert from "./pages/CareersFakeJobAlert";
import CareersAdminLogin from "./pages/CareersAdminLogin";
import CareersAdminDashboard from "./pages/CareersAdminDashboard";
import CareersAdminRoute from "./components/CareersAdminRoute";

import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

import Tax from "./pages/service-details/Tax";
import Accounting from "./pages/service-details/Accounting";
import Auditing from "./pages/service-details/Auditing";
import AdminSupport from "./pages/service-details/AdminSupport";

/* New isolated Careers public pages */
// Careers is on hold. Restore this import when re-enabling the /careers route.
// import CareersModule from "./careers/pages/Careers";
import JobDetails from "./careers/pages/JobDetails";
import ApplyJob from "./careers/pages/ApplyJob";

/* New isolated Careers admin components */
import CareersProtectedRoute from "./careers/components/CareersProtectedRoute";

/* New isolated Careers admin pages */
import CareersManagementLogin from "./careers/admin/Login";
import CareersDashboard from "./careers/admin/Dashboard";
import AddJob from "./careers/admin/AddJob";
import ManageJobs from "./careers/admin/ManageJobs";
import EditJob from "./careers/admin/EditJob";
import Applicants from "./careers/admin/Applicants";
import ApplicantDetails from "./careers/admin/ApplicantDetails";

function ProtectedCareersAdminPage({ children }) {
  return (
    <CareersProtectedRoute>
      {children}
    </CareersProtectedRoute>
  );
}

function App() {
  const location = useLocation();

  /*
   * Hide the public website Header, Footer and contact
   * button on every Careers admin route.
   */
  const isCareersManagementRoute =
    location.pathname === "/admin" ||
    location.pathname.startsWith("/admin/");

  useEffect(() => {
    AOS.init({
      duration: 500,
      easing: "ease-out-cubic",
      once: true,
      offset: 60,
    });
  }, []);

  useEffect(() => {
    const refreshTimer = setTimeout(() => {
      AOS.refresh();
    }, 300);

    return () => {
      clearTimeout(refreshTimer);
    };
  }, [location.pathname]);

  useEffect(() => {
    if (location.hash) {
      const target = document.getElementById(
        location.hash.slice(1)
      );

      if (target) {
        target.scrollIntoView({
          block: "start",
        });

        return;
      }
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [location.pathname, location.hash]);

  return (
    <>
      {!isCareersManagementRoute && <Header />}

      <main>
        <Routes>
          {/* Existing main pages */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />

          {/* Existing service detail pages */}
          <Route path="/services/tax" element={<Tax />} />

          <Route
            path="/services/accounting-bookkeeping"
            element={<Accounting />}
          />

          <Route
            path="/services/auditing-assurance"
            element={<Auditing />}
          />

          <Route
            path="/services/admin-support"
            element={<AdminSupport />}
          />

          {/* Existing resources and articles */}
          <Route
            path="/resources"
            element={<Resources />}
          />

          <Route
            path="/blog/:slug"
            element={<ArticlePage />}
          />

          {/* Existing additional pages */}
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />

          {/* Careers public pages */}
          <Route
            path="/careers"
            element={<Navigate to="/" replace />}
          />

          <Route
            path="/careers/job/:id"
            element={<JobDetails />}
          />

          <Route
            path="/careers/job/:id/apply"
            element={<ApplyJob />}
          />

          {/* Existing Careers information pages */}
          <Route
            path="/careers/about"
            element={<CareersAbout />}
          />

          <Route
            path="/careers/the-upsilon-way"
            element={<CareersTheUpsilonWay />}
          />

          <Route
            path="/careers/fake-job-alert"
            element={<CareersFakeJobAlert />}
          />

          {/* Existing legacy Careers admin routes */}
          <Route
            path="/careers-admin/login"
            element={<CareersAdminLogin />}
          />

          <Route
            path="/careers-admin"
            element={
              <CareersAdminRoute>
                <CareersAdminDashboard />
              </CareersAdminRoute>
            }
          />

          {/* Careers management login */}
          <Route
            path="/admin"
            element={<CareersManagementLogin />}
          />

          {/* Redirect old login URL to the new login URL */}
          <Route
            path="/admin/careers/login"
            element={
              <Navigate
                to="/admin"
                replace
              />
            }
          />

          {/* Redirect admin Careers base URL */}
          <Route
            path="/admin/careers"
            element={
              <Navigate
                to="/admin/careers/dashboard"
                replace
              />
            }
          />

          {/* Careers admin dashboard */}
          <Route
            path="/admin/careers/dashboard"
            element={
              <ProtectedCareersAdminPage>
                <CareersDashboard />
              </ProtectedCareersAdminPage>
            }
          />

          {/* Create job */}
          <Route
            path="/admin/careers/add-job"
            element={
              <ProtectedCareersAdminPage>
                <AddJob />
              </ProtectedCareersAdminPage>
            }
          />

          {/* Manage jobs */}
          <Route
            path="/admin/careers/manage-jobs"
            element={
              <ProtectedCareersAdminPage>
                <ManageJobs />
              </ProtectedCareersAdminPage>
            }
          />

          {/* Edit job */}
          <Route
            path="/admin/careers/edit-job/:id"
            element={
              <ProtectedCareersAdminPage>
                <EditJob />
              </ProtectedCareersAdminPage>
            }
          />

          {/* Manage applicants */}
          <Route
            path="/admin/careers/applicants"
            element={
              <ProtectedCareersAdminPage>
                <Applicants />
              </ProtectedCareersAdminPage>
            }
          />

          {/* Individual applicant details */}
          <Route
            path="/admin/careers/applicants/:id"
            element={
              <ProtectedCareersAdminPage>
                <ApplicantDetails />
              </ProtectedCareersAdminPage>
            }
          />

          {/* Existing legal pages */}
          <Route
            path="/privacy-policy"
            element={<PrivacyPolicy />}
          />

          <Route
            path="/terms-of-use"
            element={<Terms />}
          />

          {/* Existing 404 page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {!isCareersManagementRoute && <Footer />}

      {!isCareersManagementRoute && (
        <StickyContactButton />
      )}
    </>
  );
}

export default App;
