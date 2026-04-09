import { Routes, Route, Navigate } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { User, BookOpen, BarChart3, DollarSign, Plus, Video, Share2, Megaphone, LayoutDashboard, FileText, TrendingUp, FileBarChart, Sparkles, Globe, MessageCircle } from "lucide-react";
import CoachProfile from "@/components/coach/CoachProfile";
import CoachCourses from "@/components/coach/CoachCourses";
import CoachCourseForm from "@/components/coach/CoachCourseForm";
import CoachEnrollments from "@/components/coach/CoachEnrollments";
import CoachEarnings from "@/components/coach/CoachEarnings";
import CoachWebinars from "@/components/coach/CoachWebinars";
import SocialMediaHub from "@/components/shared/SocialMediaHub";
import CoachCampaigns from "@/components/coach/CoachCampaigns";
import CoachOverview from "@/components/coach/CoachOverview";
import DashboardMaterials from "@/components/shared/DashboardMaterials";
import CoachCampaignInsights from "@/components/coach/CoachCampaignInsights";
import CoachReportBuilder from "@/components/coach/CoachReportBuilder";
import PromptGeneratorForm from "@/components/prompt/PromptGeneratorForm";
import CoachWebsiteManager from "@/components/coach/CoachWebsiteManager";
import CoachWhatsApp from "@/components/coach/CoachWhatsApp";
import { useEmailMarketingAccess } from "@/hooks/useEmailMarketingAccess";
import { useWhatsAppAccess } from "@/hooks/useWhatsAppAccess";
import { useWorkshopAccess } from "@/hooks/useWorkshopAccess";
import { useCoachFeatures } from "@/hooks/useCoachFeatures";
import CoachWorkshops from "@/components/coach/CoachWorkshops";

const CoachDashboard = () => {
  useSEO({
    title: "Coach Dashboard – Manage Courses & Earnings",
    description: "Manage your courses, enrollments, webinars, and track your coaching earnings.",
    canonical: "https://www.aicoachportal.com/coach",
    noIndex: true,
  });

  const { hasAccess: hasEmailAccess } = useEmailMarketingAccess();
  const { hasAccess: hasWhatsAppAccess } = useWhatsAppAccess();
  const { hasAccess: hasWorkshopAccess } = useWorkshopAccess();
  const features = useCoachFeatures();

  const navItems = [
    { label: "Overview", path: "/coach/overview", icon: <LayoutDashboard className="h-4 w-4" /> },
    ...(features.courses_access ? [
      { label: "My Courses", path: "/coach/courses", icon: <BookOpen className="h-4 w-4" /> },
      { label: "Add Course", path: "/coach/courses/new", icon: <Plus className="h-4 w-4" /> },
    ] : []),
    ...(features.workshops_access ? [
      { label: "My Webinars", path: "/coach/webinars", icon: <Video className="h-4 w-4" /> },
    ] : []),
    { label: "Enrollments", path: "/coach/enrollments", icon: <BarChart3 className="h-4 w-4" /> },
    { label: "Campaign Insights", path: "/coach/insights", icon: <TrendingUp className="h-4 w-4" /> },
    { label: "Report Builder", path: "/coach/reports", icon: <FileBarChart className="h-4 w-4" /> },
    { label: "Materials", path: "/coach/materials", icon: <FileText className="h-4 w-4" /> },
    ...(features.feed_access ? [
      { label: "Social Media", path: "/coach/social", icon: <Share2 className="h-4 w-4" /> },
    ] : []),
    ...(hasEmailAccess && features.messaging_access ? [{ label: "Campaigns", path: "/coach/campaigns", icon: <Megaphone className="h-4 w-4" /> }] : []),
    ...(hasWhatsAppAccess && features.messaging_access ? [{ label: "WhatsApp Campaigns", path: "/coach/whatsapp", icon: <MessageCircle className="h-4 w-4" /> }] : []),
    ...(hasWorkshopAccess && features.workshops_access ? [{ label: "Workshops", path: "/coach/workshops", icon: <Video className="h-4 w-4" /> }] : []),
    { label: "Earnings", path: "/coach/earnings", icon: <DollarSign className="h-4 w-4" /> },
    { label: "Prompt Generator", path: "/coach/prompt-generator", icon: <Sparkles className="h-4 w-4" /> },
    { label: "My Website", path: "/coach/website", icon: <Globe className="h-4 w-4" /> },
    { label: "Profile", path: "/coach/profile", icon: <User className="h-4 w-4" /> },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Coach Dashboard" marqueeSegment="coach">
      <Routes>
        <Route path="courses" element={features.courses_access ? <CoachCourses /> : <Navigate to="overview" replace />} />
        <Route path="courses/new" element={features.courses_access ? <CoachCourseForm /> : <Navigate to="overview" replace />} />
        <Route path="courses/:id/edit" element={features.courses_access ? <CoachCourseForm /> : <Navigate to="overview" replace />} />
        <Route path="webinars" element={features.workshops_access ? <CoachWebinars /> : <Navigate to="overview" replace />} />
        <Route path="enrollments" element={<CoachEnrollments />} />
        <Route path="insights" element={<CoachCampaignInsights />} />
        <Route path="reports" element={<CoachReportBuilder />} />
        <Route path="materials" element={<DashboardMaterials />} />
        <Route path="social" element={features.feed_access ? <SocialMediaHub /> : <Navigate to="overview" replace />} />
        <Route path="campaigns" element={hasEmailAccess && features.messaging_access ? <CoachCampaigns /> : <Navigate to="overview" replace />} />
        <Route path="whatsapp" element={hasWhatsAppAccess && features.messaging_access ? <CoachWhatsApp /> : <Navigate to="overview" replace />} />
        <Route path="workshops" element={hasWorkshopAccess && features.workshops_access ? <CoachWorkshops /> : <Navigate to="overview" replace />} />
        <Route path="earnings" element={<CoachEarnings />} />
        <Route path="profile" element={<CoachProfile />} />
        <Route path="prompt-generator" element={<div className="space-y-4"><h2 className="text-xl font-bold text-foreground">Prompt Generator</h2><div className="rounded-xl border border-border bg-card p-6"><PromptGeneratorForm showSave userRole="coach" /></div></div>} />
        <Route path="website" element={<CoachWebsiteManager />} />
        <Route path="overview" element={<CoachOverview />} />
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default CoachDashboard;
