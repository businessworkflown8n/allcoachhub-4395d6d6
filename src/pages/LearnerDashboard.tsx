import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { BookOpen, User, Heart, History, Award, Settings, Video, Zap } from "lucide-react";
import LearnerProfile from "@/components/learner/LearnerProfile";
import LearnerCourses from "@/components/learner/LearnerCourses";
import LearnerWishlist from "@/components/learner/LearnerWishlist";
import LearnerPayments from "@/components/learner/LearnerPayments";
import LearnerCertificates from "@/components/learner/LearnerCertificates";
import LearnerReferrals from "@/components/learner/LearnerReferrals";
import LearnerWebinars from "@/components/learner/LearnerWebinars";
import LearnerDailyZip from "@/components/learner/LearnerDailyZip";

const navItems = [
  { label: "My Courses", path: "/learner/courses", icon: <BookOpen className="h-4 w-4" /> },
  { label: "Webinars", path: "/learner/webinars", icon: <Video className="h-4 w-4" /> },
  { label: "Daily Zip", path: "/learner/daily-zip", icon: <Zap className="h-4 w-4" /> },
  { label: "Profile", path: "/learner/profile", icon: <User className="h-4 w-4" /> },
  { label: "Wishlist", path: "/learner/wishlist", icon: <Heart className="h-4 w-4" /> },
  { label: "Payment History", path: "/learner/payments", icon: <History className="h-4 w-4" /> },
  { label: "Certificates", path: "/learner/certificates", icon: <Award className="h-4 w-4" /> },
  { label: "Referrals", path: "/learner/referrals", icon: <Settings className="h-4 w-4" /> },
];

const LearnerDashboard = () => {
  return (
    <DashboardLayout navItems={navItems} title="Learner Dashboard">
      <Routes>
        <Route path="courses" element={<LearnerCourses />} />
        <Route path="webinars" element={<LearnerWebinars />} />
        <Route path="daily-zip" element={<LearnerDailyZip />} />
        <Route path="profile" element={<LearnerProfile />} />
        <Route path="wishlist" element={<LearnerWishlist />} />
        <Route path="payments" element={<LearnerPayments />} />
        <Route path="certificates" element={<LearnerCertificates />} />
        <Route path="referrals" element={<LearnerReferrals />} />
        <Route path="*" element={<Navigate to="courses" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default LearnerDashboard;
