import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";
import { SplashScreen } from "@/components/SplashScreen";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import Search from "./pages/Search";
import Analyzer from "./pages/Analyzer";
import Generator from "./pages/Generator";
import Guide from "./pages/Guide";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Training from "./pages/Training";
import FemaleTraining from "./pages/FemaleTraining";
import FemaleGuide from "./pages/FemaleGuide";
import ProfileAnalyzer from "./pages/ProfileAnalyzer";
import Favorites from "./pages/Favorites";
import Profile from "./pages/Profile";
import Install from "./pages/Install";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth" element={<AuthCallback />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/" element={<AuthGuard><Index /></AuthGuard>} />
            <Route path="/chat" element={<AuthGuard><Chat /></AuthGuard>} />
            <Route path="/search" element={<AuthGuard><Search /></AuthGuard>} />
            <Route path="/analyzer" element={<AuthGuard><Analyzer /></AuthGuard>} />
            <Route path="/generator" element={<AuthGuard><Generator /></AuthGuard>} />
            <Route path="/guide" element={<AuthGuard><Guide /></AuthGuard>} />
            <Route path="/female-training" element={<AuthGuard><FemaleTraining /></AuthGuard>} />
            <Route path="/female-guide" element={<AuthGuard><FemaleGuide /></AuthGuard>} />
            <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
            <Route path="/admin" element={<AuthGuard><Admin /></AuthGuard>} />
            <Route path="/training" element={<AuthGuard><Training /></AuthGuard>} />
            <Route path="/profile-analyzer" element={<AuthGuard><ProfileAnalyzer /></AuthGuard>} />
            <Route path="/favorites" element={<AuthGuard><Favorites /></AuthGuard>} />
            <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
            <Route path="/install" element={<AuthGuard><Index /></AuthGuard>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
