import { Phone, MessageCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminLogin from "./pages/AdminLogin";
import CourseDetail from "./pages/CourseDetail";
import Enroll from "./pages/Enroll";
import LearnerDashboard from "./pages/LearnerDashboard";
import CoachDashboard from "./pages/CoachDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode; allowedRole: string }) => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (role !== allowedRole && allowedRole !== "any") return <Navigate to="/" replace />;

  return <>{children}</>;
};

const FloatingButtons = () => {
  const isMobile = useIsMobile();
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {isMobile && (
        <a
          href="tel:+919852411280"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110"
          aria-label="Call Us"
        >
          <Phone className="h-6 w-6" />
        </a>
      )}
      <a
        href="https://wa.me/919852411280"
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(142,70%,45%)] text-white shadow-lg transition-transform hover:scale-110"
        aria-label="WhatsApp"
      >
        <MessageCircle className="h-6 w-6" />
      </a>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/course/:id" element={<CourseDetail />} />
            <Route path="/enroll/:courseId" element={
              <ProtectedRoute allowedRole="learner">
                <Enroll />
              </ProtectedRoute>
            } />
            <Route path="/learner/*" element={
              <ProtectedRoute allowedRole="learner">
                <LearnerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/coach/*" element={
              <ProtectedRoute allowedRole="coach">
                <CoachDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/*" element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <FloatingButtons />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
