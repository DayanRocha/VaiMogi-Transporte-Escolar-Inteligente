
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import DriverApp from "./pages/DriverApp";
import { GuardianApp } from "./pages/GuardianApp";
import NotFound from "./pages/NotFound";
import { AuthFlow } from "./components/AuthFlow";
import { LandingPage } from "./components/LandingPage";
import { ProtectedRoute } from "./components/ProtectedRoute";


const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/driver" element={
              <ProtectedRoute>
                <DriverApp />
              </ProtectedRoute>
            } />
            <Route path="/guardian" element={
              <ProtectedRoute>
                <GuardianApp />
              </ProtectedRoute>
            } />
            <Route path="/auth" element={<AuthFlow />} />
            <Route path="/login" element={<AuthFlow />} />
            <Route path="/register" element={<AuthFlow />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
