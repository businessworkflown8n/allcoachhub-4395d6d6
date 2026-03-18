import { Routes, Route, Navigate } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { BarChart3, Users, GraduationCap, DollarSign, Settings, Star, Shield, BookOpen, Video, ClipboardList, TrendingUp, Globe, Bot, MessageSquare, Gamepad2, Mail, Share2, Megaphone, UserCheck, MousePointerClick, FolderOpen, Plug, FileCheck, Search } from "lucide-react";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminCoaches from "@/components/admin/AdminCoaches";
import AdminLearners from "@/components/admin/AdminLearners";
import AdminCourses from "@/components/admin/AdminCourses";
import AdminRevenue from "@/components/admin/AdminRevenue";
import AdminReviews from "@/components/admin/AdminReviews";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminWebinars from "@/components/admin/AdminWebinars";
import AdminEnrollments from "@/components/admin/AdminEnrollments";
import AdminCoachPerformance from "@/components/admin/AdminCoachPerformance";
import AdminLocaleSettings from "@/components/admin/AdminLocaleSettings";
import AdminChatbotLeads from "@/components/admin/AdminChatbotLeads";
import AdminCommunicationSettings from "@/components/admin/AdminCommunicationSettings";
import AdminDailyZip from "@/components/admin/AdminDailyZip";
import AdminBlogs from "@/components/admin/AdminBlogs";
import AdminEmailTools from "@/components/admin/AdminEmailTools";
import AdminSocialMedia from "@/components/admin/AdminSocialMedia";
import AdminCampaigns from "@/components/admin/AdminCampaigns";
import AdminWebinarRegistrations from "@/components/admin/AdminWebinarRegistrations";
import AdminTrafficAnalytics from "@/components/admin/AdminTrafficAnalytics";
import AdminMaterials from "@/components/admin/AdminMaterials";
import AdminIntegrationsHub from "@/components/admin/AdminIntegrationsHub";
import AdminCoachCampaigns from "@/components/admin/AdminCoachCampaigns";
import AdminSharingRequests from "@/components/admin/AdminSharingRequests";
import AdminSEODashboard from "@/components/admin/AdminSEODashboard";
const navItems = [
  { label: "Analytics", path: "/admin", icon: <BarChart3 className="h-4 w-4" /> },
  { label: "Traffic Analytics", path: "/admin/traffic", icon: <MousePointerClick className="h-4 w-4" /> },
  { label: "Coaches", path: "/admin/coaches", icon: <Shield className="h-4 w-4" /> },
  { label: "Learners", path: "/admin/learners", icon: <GraduationCap className="h-4 w-4" /> },
  { label: "Courses", path: "/admin/courses", icon: <BookOpen className="h-4 w-4" /> },
  { label: "Blog Management", path: "/admin/blogs", icon: <BookOpen className="h-4 w-4" /> },
  { label: "Materials", path: "/admin/materials", icon: <FolderOpen className="h-4 w-4" /> },
  { label: "Webinars", path: "/admin/webinars", icon: <Video className="h-4 w-4" /> },
  { label: "Webinar Registrations", path: "/admin/webinar-registrations", icon: <UserCheck className="h-4 w-4" /> },
  { label: "Enrollments", path: "/admin/enrollments", icon: <ClipboardList className="h-4 w-4" /> },
  { label: "Coach Performance", path: "/admin/performance", icon: <TrendingUp className="h-4 w-4" /> },
  { label: "Revenue", path: "/admin/revenue", icon: <DollarSign className="h-4 w-4" /> },
  { label: "Reviews", path: "/admin/reviews", icon: <Star className="h-4 w-4" /> },
  { label: "Chatbot Leads", path: "/admin/chatbot-leads", icon: <Bot className="h-4 w-4" /> },
  { label: "Communication", path: "/admin/communication", icon: <MessageSquare className="h-4 w-4" /> },
  { label: "Daily Zip", path: "/admin/daily-zip", icon: <Gamepad2 className="h-4 w-4" /> },
  { label: "Email Marketing", path: "/admin/email-tools", icon: <Mail className="h-4 w-4" /> },
  { label: "Social Media", path: "/admin/social", icon: <Share2 className="h-4 w-4" /> },
  { label: "Campaigns", path: "/admin/campaigns", icon: <Megaphone className="h-4 w-4" /> },
  { label: "Coach Campaigns", path: "/admin/coach-campaigns", icon: <TrendingUp className="h-4 w-4" /> },
  { label: "Integrations", path: "/admin/integrations", icon: <Plug className="h-4 w-4" /> },
  { label: "Sharing Requests", path: "/admin/sharing", icon: <FileCheck className="h-4 w-4" /> },
  { label: "Settings", path: "/admin/settings", icon: <Settings className="h-4 w-4" /> },
  { label: "Locale & Currency", path: "/admin/locale", icon: <Globe className="h-4 w-4" /> },
];

const AdminDashboard = () => {
  useSEO({
    title: "Admin Dashboard – AI Coach Portal",
    description: "Platform administration dashboard for managing courses, coaches, learners, and analytics.",
    canonical: "https://www.aicoachportal.com/admin",
    noIndex: true,
  });

  return (
    <DashboardLayout navItems={navItems} title="Admin Dashboard">
      <Routes>
        <Route index element={<AdminOverview />} />
        <Route path="traffic" element={<AdminTrafficAnalytics />} />
        <Route path="coaches" element={<AdminCoaches />} />
        <Route path="learners" element={<AdminLearners />} />
        <Route path="courses" element={<AdminCourses />} />
        <Route path="blogs" element={<AdminBlogs />} />
        <Route path="materials" element={<AdminMaterials />} />
        <Route path="webinars" element={<AdminWebinars />} />
        <Route path="webinar-registrations" element={<AdminWebinarRegistrations />} />
        <Route path="enrollments" element={<AdminEnrollments />} />
        <Route path="performance" element={<AdminCoachPerformance />} />
        <Route path="revenue" element={<AdminRevenue />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="chatbot-leads" element={<AdminChatbotLeads />} />
        <Route path="communication" element={<AdminCommunicationSettings />} />
        <Route path="daily-zip" element={<AdminDailyZip />} />
        <Route path="email-tools" element={<AdminEmailTools />} />
        <Route path="social" element={<AdminSocialMedia />} />
        <Route path="campaigns" element={<AdminCampaigns />} />
        <Route path="coach-campaigns" element={<AdminCoachCampaigns />} />
        <Route path="integrations" element={<AdminIntegrationsHub />} />
        <Route path="sharing" element={<AdminSharingRequests />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="locale" element={<AdminLocaleSettings />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default AdminDashboard;
