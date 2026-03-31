import { Routes, Route, Navigate } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { User, BookOpen, BarChart3, DollarSign, Plus, Video, Share2, Megaphone, LayoutDashboard, FileText, TrendingUp, FileBarChart, Sparkles, Globe } from "lucide-react";
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
import { useEmailMarketingAccess } from "@/hooks/useEmailMarketingAccess";

const CoachDashboard = () => {
  useSEO({
    title: "Coach Dashboard – Manage Courses & Earnings",
    description: "Manage your courses, enrollments, webinars, and track your coaching earnings.",
    canonical: "https://www.aicoachportal.com/coach",
    noIndex: true,
  });

  const { hasAccess: hasEmailAccess } = useEmailMarketingAccess();

  const navItems = [
    { label: "Overview", path: "/coach/overview", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "My Courses", path: "/coach/courses", icon: <BookOpen className="h-4 w-4" /> },
    { label: "Add Course", path: "/coach/courses/new", icon: <Plus className="h-4 w-4" /> },
    { label: "My Webinars", path: "/coach/webinars", icon: <Video className="h-4 w-4" /> },
    { label: "Enrollments", path: "/coach/enrollments", icon: <BarChart3 className="h-4 w-4" /> },
    { label: "Campaign Insights", path: "/coach/insights", icon: <TrendingUp className="h-4 w-4" /> },
    { label: "Report Builder", path: "/coach/reports", icon: <FileBarChart className="h-4 w-4" /> },
    { label: "Materials", path: "/coach/materials", icon: <FileText className="h-4 w-4" /> },
    { label: "Social Media", path: "/coach/social", icon: <Share2 className="h-4 w-4" /> },
    ...(hasEmailAccess ? [{ label: "Campaigns", path: "/coach/campaigns", icon: <Megaphone className="h-4 w-4" /> }] : []),
    { label: "Earnings", path: "/coach/earnings", icon: <DollarSign className="h-4 w-4" /> },
    { label: "Prompt Generator", path: "/coach/prompt-generator", icon: <Sparkles className="h-4 w-4" /> },
    { label: "My Website", path: "/coach/website", icon: <Globe className="h-4 w-4" /> },
    { label: "Profile", path: "/coach/profile", icon: <User className="h-4 w-4" /> },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Coach Dashboard">
      <Routes>
        <Route path="courses" element={<CoachCourses />} />
        <Route path="courses/new" element={<CoachCourseForm />} />
        <Route path="courses/:id/edit" element={<CoachCourseForm />} />
        <Route path="webinars" element={<CoachWebinars />} />
        <Route path="enrollments" element={<CoachEnrollments />} />
        <Route path="insights" element={<CoachCampaignInsights />} />
        <Route path="reports" element={<CoachReportBuilder />} />
        <Route path="materials" element={<DashboardMaterials />} />
        <Route path="social" element={<SocialMediaHub />} />
        <Route path="campaigns" element={hasEmailAccess ? <CoachCampaigns /> : <Navigate to="overview" replace />} />
        <Route path="earnings" element={<CoachEarnings />} />
        <Route path="profile" element={<CoachProfile />} />
        <Route path="prompt-generator" element={<div className="space-y-4"><h2 className="text-xl font-bold text-foreground">Prompt Generator</h2><div className="rounded-xl border border-border bg-card p-6"><PromptGeneratorForm showSave userRole="coach" /></div></div>} />
        <Route path="overview" element={<CoachOverview />} />
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default CoachDashboard;
