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
      <Route path="/quote/accept/:token" component={QuoteAcceptance} />
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
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
