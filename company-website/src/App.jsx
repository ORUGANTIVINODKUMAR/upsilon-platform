import { lazy, Suspense, useEffect } from "react";
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

import CareersAdminRoute from "./components/CareersAdminRoute";
import CareersProtectedRoute from "./careers/components/CareersProtectedRoute";

const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Services = lazy(() => import("./pages/Services"));
const Resources = lazy(() => import("./pages/Resources"));
const ArticlePage = lazy(() => import("./pages/ArticlePage"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Contact = lazy(() => import("./pages/Contact"));
const CareersAbout = lazy(() => import("./pages/CareersAbout"));
const CareersTheUpsilonWay = lazy(() => import("./pages/CareersTheUpsilonWay"));
const CareersFakeJobAlert = lazy(() => import("./pages/CareersFakeJobAlert"));
const CareersAdminLogin = lazy(() => import("./pages/CareersAdminLogin"));
const CareersAdminDashboard = lazy(() => import("./pages/CareersAdminDashboard"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Terms = lazy(() => import("./pages/Terms"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Tax = lazy(() => import("./pages/service-details/Tax"));
const Accounting = lazy(() => import("./pages/service-details/Accounting"));
const Auditing = lazy(() => import("./pages/service-details/Auditing"));
const AdminSupport = lazy(() => import("./pages/service-details/AdminSupport"));
const JobDetails = lazy(() => import("./careers/pages/JobDetails"));
const ApplyJob = lazy(() => import("./careers/pages/ApplyJob"));
const CareersManagementLogin = lazy(() => import("./careers/admin/Login"));
const CareersDashboard = lazy(() => import("./careers/admin/Dashboard"));
const AddJob = lazy(() => import("./careers/admin/AddJob"));
const ManageJobs = lazy(() => import("./careers/admin/ManageJobs"));
const EditJob = lazy(() => import("./careers/admin/EditJob"));
const Applicants = lazy(() => import("./careers/admin/Applicants"));
const ApplicantDetails = lazy(() => import("./careers/admin/ApplicantDetails"));

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

      <div className="site-main" key={location.pathname}>
        <Suspense
          fallback={(
            <div className="route-loading" role="status" aria-live="polite">
              <span className="route-loading-bar" />
              <span className="sr-only">Loading page</span>
            </div>
          )}
        >
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
        </Suspense>
      </div>

      {!isCareersManagementRoute && <Footer />}

      {!isCareersManagementRoute && (
        <StickyContactButton />
      )}
    </>
  );
}

export default App;
