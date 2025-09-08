import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import { LoadingProvider } from "@/contexts/loading-context";
import GlobalLoading from "@/components/global-loading";
import Landing from "@/pages/landing";
import Features from "@/pages/features";
import Demo from "@/pages/demo";
import Gallery from "@/pages/gallery";
import Login from "@/pages/login";
import AdminPanel from "@/pages/admin";
import EventSettings from "@/pages/event-settings";
import EventoPersonal from "@/pages/evento-personal";
import RegistroAsistencia from "@/pages/registro-asistencia";
import AdminCheckin from "@/pages/admin-checkin";
import EmailTest from "@/pages/email-test";
import AdminLinks from "@/pages/admin-links";
import AdminGlobalFeatures from "@/pages/admin-global-features";
import DebugPage from "@/pages/debug";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/features" component={Features} />
      <Route path="/demo" component={Demo} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={EventSettings} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/admin/links" component={AdminLinks} />
      <Route path="/admin/global-features" component={AdminGlobalFeatures} />
      <Route path="/email-test" component={EmailTest} />
      <Route path="/debug" component={DebugPage} />
      <Route path="/evento/:username/registro" component={RegistroAsistencia} />
      <Route path="/evento/:username/checkin" component={AdminCheckin} />
      {/* 
        ROUTE LOGIC: Dynamic routing for /evento/:param
        - If param ends with '-album' → Gallery page (photo upload interface)
        - Otherwise → EventoPersonal page (event join interface)
        
        Examples:
        - /evento/javier → EventoPersonal (join event page)
        - /evento/javier-album → Gallery (photo gallery page)
        
        DEBUG: Check props.params to see actual param value received
      */}
      <Route path="/evento/:param" component={(props) => {
        const { param } = props.params;
        // DEBUG: Uncomment to debug routing issues
        // console.log('Route param received:', param);
        
        if (param?.endsWith('-album')) {
          return <Gallery />;
        }

        return <EventoPersonal />;
      }} />
      <Route path="/event/:eventTitle" component={Gallery} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  console.log('🔥 DEPLOYMENT FORCE UPDATE:', 'v3.0.FORCE.1753384576342');
  console.log('⏰ Deployment Time:', new Date().toISOString());

  // DEBUG: Version tracking for deployment debugging
  console.log("🔥 APP LOADED - VERSION: v2.0.FINAL.24072025");
  console.log("🌍 Environment:", import.meta.env.MODE);
  console.log("📍 Base URL:", import.meta.env.BASE_URL);
  console.log("⏰ App Load Time:", new Date().toISOString());
  
  return (
    <QueryClientProvider client={queryClient}>
      <LoadingProvider>
        <AuthProvider>
          <TooltipProvider>
            <GlobalLoading />
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </LoadingProvider>
    </QueryClientProvider>
  );
}

export default App;
