import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { User, BookOpen, BarChart3, DollarSign, Plus, Video } from "lucide-react";
import CoachProfile from "@/components/coach/CoachProfile";
import CoachCourses from "@/components/coach/CoachCourses";
import CoachCourseForm from "@/components/coach/CoachCourseForm";
import CoachEnrollments from "@/components/coach/CoachEnrollments";
import CoachEarnings from "@/components/coach/CoachEarnings";
import CoachWebinars from "@/components/coach/CoachWebinars";

const navItems = [
  { label: "My Courses", path: "/coach/courses", icon: <BookOpen className="h-4 w-4" /> },
  { label: "Add Course", path: "/coach/courses/new", icon: <Plus className="h-4 w-4" /> },
  { label: "My Webinars", path: "/coach/webinars", icon: <Video className="h-4 w-4" /> },
  { label: "Enrollments", path: "/coach/enrollments", icon: <BarChart3 className="h-4 w-4" /> },
  { label: "Earnings", path: "/coach/earnings", icon: <DollarSign className="h-4 w-4" /> },
  { label: "Profile", path: "/coach/profile", icon: <User className="h-4 w-4" /> },
];

const CoachDashboard = () => {
  return (
    <DashboardLayout navItems={navItems} title="Coach Dashboard">
      <Routes>
        <Route path="courses" element={<CoachCourses />} />
        <Route path="courses/new" element={<CoachCourseForm />} />
        <Route path="courses/:id/edit" element={<CoachCourseForm />} />
        <Route path="webinars" element={<CoachWebinars />} />
        <Route path="enrollments" element={<CoachEnrollments />} />
        <Route path="earnings" element={<CoachEarnings />} />
        <Route path="profile" element={<CoachProfile />} />
        <Route path="*" element={<Navigate to="courses" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default CoachDashboard;
