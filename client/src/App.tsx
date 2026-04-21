import Analytics from "./components/Analytics";
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
import BetaLanding from "./pages/BetaLanding";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DataDeletion from "./pages/DataDeletion";
import TermsOfService from "./pages/TermsOfService";
import Support from "./pages/Support";
import CabinetJoinery from "./pages/CabinetJoinery";
import About from "./pages/About";
import Help from "./pages/Help";
import FbLeadsDashboard from "./pages/FbLeadsDashboard";
import CompanySettings from "./pages/CompanySettings";
import AccuracyDashboard from "./pages/AccuracyDashboard";
import MotylDemo from "./pages/MotylDemo";
import GetGasDemo from "./pages/GetGasDemo";
import AIHelpAssistant from "./components/AIHelpAssistant";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/projects" component={Projects} />
      <Route path="/projects/:id" component={ProjectDetail} />
      <Route path="/estimates/:id" component={EstimateBuilder} />
      <Route path="/materials" component={MaterialsLibrary} />
      <Route path="/labour" component={LabourRates} />
      <Route path="/profile" component={Profile} />
      <Route path="/ai-takeoff" component={AITakeoff} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/billing" component={Billing} />
      <Route path="/trade-profiles" component={TradeProfile} />
      <Route path="/demo" component={DemoMode} />
      <Route path="/suppliers" component={SupplierManager} />
      <Route path="/followups" component={QuoteFollowups} />
      <Route path="/projects/:projectId/variations" component={VariationsRegister} />
      <Route path="/quote/accept/:token" component={QuoteAcceptance} />
      <Route path="/beta" component={BetaLanding} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/data-deletion" component={DataDeletion} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/support" component={Support} />
      <Route path="/cabinet-joinery" component={CabinetJoinery} />
      <Route path="/about" component={About} />
      <Route path="/help" component={Help} />
      <Route path="/admin/fb-leads" component={FbLeadsDashboard} />
      <Route path="/settings" component={CompanySettings} />
      <Route path="/accuracy" component={AccuracyDashboard} />
      <Route path="/motyl" component={MotylDemo} />
      <Route path="/moytle" component={MotylDemo} />
      <Route path="/getgas" component={GetGasDemo} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-right" richColors />
          <Analytics />
          <Router />
          <AIHelpAssistant />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
