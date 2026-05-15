import Analytics from "./components/Analytics";
import MetaPixel from "./components/MetaPixel";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import EstimateBuilder from "./pages/EstimateBuilder";
import MaterialsLibrary from "./pages/MaterialsLibrary";
import LabourRates from "./pages/LabourRates";
import Profile from "./pages/Profile";
import QuoteAcceptance from "./pages/QuoteAcceptance";
import AITakeoff from "./pages/AITakeoff";
import Pricing from "./pages/Pricing";
import Billing from "./pages/Billing";
import TradeProfile from "./pages/TradeProfile";
import DemoMode from "./pages/DemoMode";
import SupplierManager from "./pages/SupplierManager";
import QuoteFollowups from "./pages/QuoteFollowups";
import VariationsRegister from "./pages/VariationsRegister";
// BetaLanding removed — product is live
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DataDeletion from "./pages/DataDeletion";
import TermsOfService from "./pages/TermsOfService";
import Support from "./pages/Support";
import CabinetJoinery from "./pages/CabinetJoinery";
import About from "./pages/About";
import Help from "./pages/Help";
import { lazy, Suspense } from "react";
import CompanySettings from "./pages/CompanySettings";
import AccuracyDashboard from "./pages/AccuracyDashboard";
import MotylDemo from "./pages/MotylDemo";
import EbookGuide from "./pages/EbookGuide";
import GetGasDemo from "./pages/GetGasDemo";
import AIHelpAssistant from "./components/AIHelpAssistant";
import PostHogPageTracker from "./components/PostHogPageTracker";
import Login from "./pages/Login";
import { ProtectedRoute } from "./components/ProtectedRoute";
import SwmsEditor from "./pages/SwmsEditor";
import SwmsSign from "./pages/SwmsSign";
import BetaExpired from "./pages/BetaExpired";

const FbLeadsDashboard = lazy(() => import("./pages/FbLeadsDashboard"));
const LaunchEngineLandingPage = lazy(() => import("./launch-engine/LandingPage"));
const LaunchEngineBrandScanPage = lazy(() => import("./launch-engine/BrandScanPage"));
const LaunchEngineDashboardPage = lazy(() => import("./launch-engine/DashboardPage"));
const AdEngineOverviewPage = lazy(() => import("./ad-engine/OverviewPage"));
const AdEngineCreativePage = lazy(() => import("./ad-engine/CreativePage"));

function Router() {
  const protectedPage = (Component: React.ComponentType) => () => (
    <ProtectedRoute>
      <Component />
    </ProtectedRoute>
  );

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dashboard" component={protectedPage(Dashboard)} />
        <Route path="/projects" component={protectedPage(Projects)} />
        <Route path="/projects/:id" component={protectedPage(ProjectDetail)} />
        <Route path="/estimates/:id" component={protectedPage(EstimateBuilder)} />
        <Route path="/materials" component={protectedPage(MaterialsLibrary)} />
        <Route path="/labour" component={protectedPage(LabourRates)} />
        <Route path="/profile" component={protectedPage(Profile)} />
        <Route path="/ai-takeoff" component={protectedPage(AITakeoff)} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/billing" component={protectedPage(Billing)} />
        <Route path="/trade-profiles" component={protectedPage(TradeProfile)} />
        <Route path="/demo" component={DemoMode} />
        <Route path="/login" component={Login} />
        <Route path="/beta-expired" component={BetaExpired} />
        <Route path="/suppliers" component={protectedPage(SupplierManager)} />
        <Route path="/followups" component={protectedPage(QuoteFollowups)} />
        <Route path="/projects/:projectId/variations" component={protectedPage(VariationsRegister)} />
        <Route path="/quote/accept/:token" component={QuoteAcceptance} />
        <Route path="/beta">{() => { window.location.href = "/pricing"; return null; }}</Route>
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/data-deletion" component={DataDeletion} />
        <Route path="/terms" component={TermsOfService} />
        <Route path="/terms-of-service" component={TermsOfService} />
        <Route path="/support" component={Support} />
        <Route path="/cabinet-joinery" component={CabinetJoinery} />
        <Route path="/about" component={About} />
        <Route path="/help" component={Help} />
        <Route path="/admin/fb-leads" component={protectedPage(FbLeadsDashboard)} />
        <Route path="/settings" component={protectedPage(CompanySettings)} />
        <Route path="/accuracy" component={protectedPage(AccuracyDashboard)} />
        <Route path="/motyl" component={MotylDemo} />
        <Route path="/guide" component={EbookGuide} />
        <Route path="/moytle" component={MotylDemo} />
        <Route path="/getgas" component={GetGasDemo} />
        <Route path="/launch-engine/brand-scan" component={LaunchEngineBrandScanPage} />
        <Route path="/launch-engine/dashboard" component={protectedPage(LaunchEngineDashboardPage)} />
        <Route path="/launch-engine" component={LaunchEngineLandingPage} />
        <Route path="/ad-engine/creative" component={protectedPage(AdEngineCreativePage)} />
        <Route path="/ad-engine" component={protectedPage(AdEngineOverviewPage)} />
        <Route path="/swms/:id" component={protectedPage(SwmsEditor)} />
        <Route path="/swms/sign/:token" component={SwmsSign} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-right" richColors />
          <MetaPixel />
          <Analytics />
          <PostHogPageTracker />
          <Router />
          <AIHelpAssistant />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
