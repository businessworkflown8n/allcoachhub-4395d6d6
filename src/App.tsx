import { Phone, MessageCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCommunicationSettings } from "@/hooks/useCommunicationSettings";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { LocaleProvider } from "@/hooks/useLocale";
import { TranslationProvider } from "@/i18n/TranslationProvider";
import Index from "./pages/Index";
import RoleSelect from "./pages/RoleSelect";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminLogin from "./pages/AdminLogin";
import AdminOTPLogin from "./pages/AdminOTPLogin";
import CourseDetail from "./pages/CourseDetail";
import Enroll from "./pages/Enroll";
import LearnerDashboard from "./pages/LearnerDashboard";
import CoachDashboard from "./pages/CoachDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ResetPassword from "./pages/ResetPassword";
import AIBlogs from "./pages/AIBlogs";
import AIBlogsCategory from "./pages/AIBlogsCategory";
import BlogPost from "./pages/BlogPost";
import Courses from "./pages/Courses";
import Webinars from "./pages/Webinars";
import DailyZip from "./pages/DailyZip";
import Unsubscribe from "./pages/Unsubscribe";
import Install from "./pages/Install";
import CoachLanding from "./pages/CoachLanding";
import Sitemap from "./pages/Sitemap";
import AISeoPrompt from "./pages/AISeoPrompt";
import NotFound from "./pages/NotFound";
import AICursor from "./components/AICursor";
import ChatbotWidget from "./components/ChatbotWidget";
import AnalyticsTracker from "./components/AnalyticsTracker";
import WebsitePopup from "./components/WebsitePopup";
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

  if (!user) return <Navigate to="/auth?mode=login" replace />;
  if (role !== allowedRole && allowedRole !== "any") return <Navigate to="/" replace />;

  return <>{children}</>;
};

const FloatingButtons = () => {
  const isMobile = useIsMobile();
  const { settings, loading } = useCommunicationSettings();

  if (loading) return null;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {isMobile && settings.call_enabled && (
          <a
            href={`tel:${settings.call_number}`}
            className="group flex h-14 w-14 items-center justify-center rounded-full border border-foreground/20 bg-background/40 backdrop-blur-md shadow-[0_4px_15px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all hover:scale-110 hover:shadow-[0_6px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15)]"
            aria-label="Call Us"
          >
            <Phone className="h-6 w-6 text-primary" />
          </a>
        )}
        {settings.whatsapp_enabled && (
          <a
            href={`https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(settings.whatsapp_message)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex h-14 w-14 items-center justify-center rounded-full border border-foreground/20 bg-background/40 backdrop-blur-md shadow-[0_4px_15px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all hover:scale-110 hover:shadow-[0_6px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15)]"
            aria-label="WhatsApp"
          >
            <svg className="h-7 w-7 text-[hsl(142,70%,45%)]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </a>
        )}
      </div>
      {settings.chatbot_enabled && <ChatbotWidget />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LocaleProvider>
      <TranslationProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnalyticsTracker />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<RoleSelect />} />
            <Route path="/login/:role" element={<Login />} />
            <Route path="/signup/:role" element={<Signup />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/otp-login" element={<AdminOTPLogin />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/ai-blogs" element={<AIBlogs />} />
            <Route path="/ai-jobs-news/ai-research/ai-seo-prompt" element={<AISeoPrompt />} />
            <Route path="/ai-jobs-news/:category" element={<AIBlogsCategory />} />
            <Route path="/ai-blogs/:slug" element={<BlogPost />} />
            <Route path="/daily-zip" element={<DailyZip />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/install" element={<Install />} />
            <Route path="/sitemap" element={<Sitemap />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/webinars" element={<Webinars />} />
            <Route path="/coach/:slug" element={<CoachLanding />} />
            <Route path="/course/:slug" element={<CourseDetail />} />
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
          <WebsitePopup />
          <AICursor />
        </BrowserRouter>
      </AuthProvider>
      </TranslationProvider>
      </LocaleProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
