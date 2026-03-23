import { Routes, Route, Navigate } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { BookOpen, User, Heart, History, Award, Settings, Video, Zap, Share2, FileText, MessageSquare, Users, Sparkles } from "lucide-react";
import LearnerProfile from "@/components/learner/LearnerProfile";
import LearnerCourses from "@/components/learner/LearnerCourses";
import LearnerWishlist from "@/components/learner/LearnerWishlist";
import LearnerPayments from "@/components/learner/LearnerPayments";
import LearnerCertificates from "@/components/learner/LearnerCertificates";
import LearnerReferrals from "@/components/learner/LearnerReferrals";
import LearnerWebinars from "@/components/learner/LearnerWebinars";
import LearnerDailyZip from "@/components/learner/LearnerDailyZip";
import SocialMediaHub from "@/components/shared/SocialMediaHub";
import DashboardMaterials from "@/components/shared/DashboardMaterials";
import LearnerChatHistory from "@/components/learner/LearnerChatHistory";
import CommunityPage from "@/components/community/CommunityPage";

const navItems = [
  { label: "My Courses", path: "/learner/courses", icon: <BookOpen className="h-4 w-4" /> },
  { label: "Webinars", path: "/learner/webinars", icon: <Video className="h-4 w-4" /> },
  { label: "Certificates", path: "/learner/certificates", icon: <Award className="h-4 w-4" /> },
  { label: "Materials", path: "/learner/materials", icon: <FileText className="h-4 w-4" /> },
  { label: "AI Community", path: "/learner/community", icon: <Users className="h-4 w-4" /> },
  { label: "Chat History", path: "/learner/chat-history", icon: <MessageSquare className="h-4 w-4" /> },
  { label: "Daily Zip", path: "/learner/daily-zip", icon: <Zap className="h-4 w-4" /> },
  { label: "Social Media", path: "/learner/social", icon: <Share2 className="h-4 w-4" /> },
  { label: "Profile", path: "/learner/profile", icon: <User className="h-4 w-4" /> },
  { label: "Wishlist", path: "/learner/wishlist", icon: <Heart className="h-4 w-4" /> },
  { label: "Payment History", path: "/learner/payments", icon: <History className="h-4 w-4" /> },
  { label: "Referrals", path: "/learner/referrals", icon: <Settings className="h-4 w-4" /> },
];

const LearnerDashboard = () => {
  useSEO({
    title: "Learner Dashboard – My Courses & Progress",
    description: "Access your enrolled courses, webinars, certificates, and learning progress.",
    canonical: "https://www.aicoachportal.com/learner",
    noIndex: true,
  });

  return (
    <DashboardLayout navItems={navItems} title="Learner Dashboard">
      <Routes>
        <Route path="courses" element={<LearnerCourses />} />
        <Route path="webinars" element={<LearnerWebinars />} />
        <Route path="certificates" element={<LearnerCertificates />} />
        <Route path="materials" element={<DashboardMaterials />} />
        <Route path="community/*" element={<CommunityPage baseUrl="/learner/community" userRole="learner" />} />
        <Route path="chat-history" element={<LearnerChatHistory />} />
        <Route path="daily-zip" element={<LearnerDailyZip />} />
        <Route path="social" element={<SocialMediaHub />} />
        <Route path="profile" element={<LearnerProfile />} />
        <Route path="wishlist" element={<LearnerWishlist />} />
        <Route path="payments" element={<LearnerPayments />} />
        <Route path="referrals" element={<LearnerReferrals />} />
        <Route path="*" element={<Navigate to="courses" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default LearnerDashboard;
