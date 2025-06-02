
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthGuard from "@/components/AuthGuard";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthGuard><Index /></AuthGuard>} />
          <Route path="/dashboard" element={<AuthGuard><Index /></AuthGuard>} />
          <Route path="/upload" element={<AuthGuard><Index /></AuthGuard>} />
          <Route path="/sales" element={<AuthGuard><Index /></AuthGuard>} />
          <Route path="/prices" element={<AuthGuard><Index /></AuthGuard>} />
          <Route path="/pumps" element={<AuthGuard><Index /></AuthGuard>} />
          <Route path="/reports" element={<AuthGuard><Index /></AuthGuard>} />
          <Route path="/settings" element={<AuthGuard><Index /></AuthGuard>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
