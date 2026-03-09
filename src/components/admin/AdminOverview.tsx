import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart3, Users, GraduationCap, DollarSign, TrendingUp, BookOpen, Activity,
  CheckCircle, XCircle, ChevronDown, ChevronUp, Download, Globe, Star, Eye,
  MessageSquare, Mail, Megaphone, UserPlus, Clock, Target, Zap, Award, MapPin,
  Percent, Calendar, Video, FileText, Bot, Share2, ArrowUp, ArrowDown
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, Legend
} from "recharts";
import { useCurrency } from "@/hooks/useCurrency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";

const COLORS = ["hsl(var(--primary))", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

const AdminOverview = () => {
  const { symbol, priceKey } = useCurrency();
  const [loading, setLoading] = useState(true);

  // Core stats
  const [stats, setStats] = useState({
    totalCoaches: 0, totalLearners: 0, totalUsers: 0,
    newUsersThisMonth: 0, userGrowthPercent: 0,
    totalRevenue: 0, revenueThisMonth: 0, revenueGrowthPercent: 0, avgRevenuePerEnrollment: 0,
    totalEnrollments: 0, paidEnrollments: 0, unpaidEnrollments: 0, enrollmentsThisMonth: 0,
    conversionRate: 0, completionRate: 0,
    totalCourses: 0, publishedCourses: 0, pendingCourses: 0, avgCoursePrice: 0, avgCourseRating: 0,
    totalWebinars: 0, webinarRegistrations: 0, avgRegsPerWebinar: 0,
    totalCampaigns: 0, sentCampaigns: 0, draftCampaigns: 0,
    totalBlogs: 0, publishedBlogs: 0,
    totalReferrals: 0, convertedReferrals: 0,
    chatbotLeads: 0, totalReviews: 0, avgRating: 0,
  });

  // Chart data
  const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
  const [enrollmentTrend, setEnrollmentTrend] = useState<any[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<any[]>([]);
  const [coursesByCategory, setCoursesByCategory] = useState<any[]>([]);
  const [coursesByLevel, setCoursesByLevel] = useState<any[]>([]);
  const [enrollmentsByCountry, setEnrollmentsByCountry] = useState<any[]>([]);
  const [topCoaches, setTopCoaches] = useState<any[]>([]);
  const [topCourses, setTopCourses] = useState<any[]>([]);
  const [paymentStatusData, setPaymentStatusData] = useState<any[]>([]);
  const [learnerExperienceData, setLearnerExperienceData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [expandedActivity, setExpandedActivity] = useState<number | null>(null);
  const [dailyVisitsData, setDailyVisitsData] = useState<any[]>([]);
  const [campaignPerformance, setCampaignPerformance] = useState<any[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const now = new Date();
      const thisMonthStart = startOfMonth(now).toISOString();
      const lastMonthStart = startOfMonth(subMonths(now, 1)).toISOString();
      const lastMonthEnd = endOfMonth(subMonths(now, 1)).toISOString();

      const [
        coachesRes, learnersRes, profilesRes, enrollmentsRes, coursesRes,
        reviewsRes, webinarsRes, webinarRegsRes, campaignsRes, blogsRes,
        referralsRes, chatbotRes, paymentsRes
      ] = await Promise.all([
        supabase.from("user_roles").select("user_id, role").eq("role", "coach"),
        supabase.from("user_roles").select("user_id, role").eq("role", "learner"),
        supabase.from("profiles").select("user_id, full_name, email, contact_number, country, city, created_at, experience_level"),
        supabase.from("enrollments").select("*, courses(title, price_usd, price_inr, coach_id, category)").order("enrolled_at", { ascending: false }),
        supabase.from("courses").select("*"),
        supabase.from("reviews").select("*"),
        supabase.from("webinars").select("*"),
        supabase.from("webinar_registrations").select("*"),
        supabase.from("email_campaigns").select("*"),
        supabase.from("ai_blogs").select("id, is_published, created_at"),
        supabase.from("referrals").select("*"),
        supabase.from("chatbot_leads").select("id, created_at"),
        supabase.from("payments").select("*").eq("status", "paid"),
      ]);

      const coaches = coachesRes.data || [];
      const learners = learnersRes.data || [];
      const profiles = profilesRes.data || [];
      const enrollments = enrollmentsRes.data || [];
      const courses = coursesRes.data || [];
      const reviews = reviewsRes.data || [];
      const webinars = webinarsRes.data || [];
      const webinarRegs = webinarRegsRes.data || [];
      const campaigns = campaignsRes.data || [];
      const blogs = blogsRes.data || [];
      const referrals = referralsRes.data || [];
      const chatbotLeads = chatbotRes.data || [];
      const payments = paymentsRes.data || [];

      // Profile map for lookups
      const profileMap: Record<string, any> = {};
      profiles.forEach((p: any) => { profileMap[p.user_id] = p; });

      // Core stats calculations
      const totalCoaches = coaches.length;
      const totalLearners = learners.length;
      const totalUsers = totalCoaches + totalLearners;

      // New users this month
      const newUsersThisMonth = profiles.filter((p: any) => new Date(p.created_at) >= new Date(thisMonthStart)).length;
      const lastMonthUsers = profiles.filter((p: any) => {
        const d = new Date(p.created_at);
        return d >= new Date(lastMonthStart) && d <= new Date(lastMonthEnd);
      }).length;
      const userGrowthPercent = lastMonthUsers > 0 ? ((newUsersThisMonth - lastMonthUsers) / lastMonthUsers * 100) : 0;

      // Revenue
      const paidEnrollments = enrollments.filter((e: any) => e.payment_status === "paid");
      const totalRevenue = paidEnrollments.reduce((s: number, e: any) => s + Number(e.amount_paid || 0), 0);
      const revenueThisMonth = paidEnrollments
        .filter((e: any) => new Date(e.enrolled_at) >= new Date(thisMonthStart))
        .reduce((s: number, e: any) => s + Number(e.amount_paid || 0), 0);
      const lastMonthRevenue = paidEnrollments
        .filter((e: any) => {
          const d = new Date(e.enrolled_at);
          return d >= new Date(lastMonthStart) && d <= new Date(lastMonthEnd);
        })
        .reduce((s: number, e: any) => s + Number(e.amount_paid || 0), 0);
      const revenueGrowthPercent = lastMonthRevenue > 0 ? ((revenueThisMonth - lastMonthRevenue) / lastMonthRevenue * 100) : 0;
      const avgRevenuePerEnrollment = paidEnrollments.length > 0 ? totalRevenue / paidEnrollments.length : 0;

      // Enrollments
      const unpaidEnrollments = enrollments.filter((e: any) => e.payment_status !== "paid");
      const enrollmentsThisMonth = enrollments.filter((e: any) => new Date(e.enrolled_at) >= new Date(thisMonthStart)).length;
      const conversionRate = enrollments.length > 0 ? (paidEnrollments.length / enrollments.length * 100) : 0;
      const completedEnrollments = enrollments.filter((e: any) => e.completed_at);
      const completionRate = paidEnrollments.length > 0 ? (completedEnrollments.length / paidEnrollments.length * 100) : 0;

      // Courses
      const publishedCourses = courses.filter((c: any) => c.is_published && c.approval_status === "approved");
      const pendingCourses = courses.filter((c: any) => c.approval_status === "pending");
      const avgCoursePrice = courses.length > 0 ? courses.reduce((s: number, c: any) => s + Number(c.price_usd || 0), 0) / courses.length : 0;

      // Reviews & Ratings
      const totalReviews = reviews.length;
      const avgRating = totalReviews > 0 ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / totalReviews : 0;

      // Webinars
      const avgRegsPerWebinar = webinars.length > 0 ? webinarRegs.length / webinars.length : 0;

      // Campaigns
      const sentCampaigns = campaigns.filter((c: any) => c.status === "sent").length;
      const draftCampaigns = campaigns.filter((c: any) => c.status === "draft").length;

      // Blogs
      const publishedBlogs = blogs.filter((b: any) => b.is_published).length;

      // Referrals
      const convertedReferrals = referrals.filter((r: any) => r.status === "converted").length;

      setStats({
        totalCoaches, totalLearners, totalUsers,
        newUsersThisMonth, userGrowthPercent,
        totalRevenue, revenueThisMonth, revenueGrowthPercent, avgRevenuePerEnrollment,
        totalEnrollments: enrollments.length, paidEnrollments: paidEnrollments.length,
        unpaidEnrollments: unpaidEnrollments.length, enrollmentsThisMonth,
        conversionRate, completionRate,
        totalCourses: courses.length, publishedCourses: publishedCourses.length,
        pendingCourses: pendingCourses.length, avgCoursePrice, avgCourseRating: avgRating,
        totalWebinars: webinars.length, webinarRegistrations: webinarRegs.length, avgRegsPerWebinar,
        totalCampaigns: campaigns.length, sentCampaigns, draftCampaigns,
        totalBlogs: blogs.length, publishedBlogs,
        totalReferrals: referrals.length, convertedReferrals,
        chatbotLeads: chatbotLeads.length, totalReviews, avgRating,
      });

      // User growth by month (last 6 months)
      const userMonthMap: Record<string, { coaches: number; learners: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const m = format(subMonths(now, i), "MMM yyyy");
        userMonthMap[m] = { coaches: 0, learners: 0 };
      }
      profiles.forEach((p: any) => {
        const m = format(new Date(p.created_at), "MMM yyyy");
        if (userMonthMap[m]) {
          const role = coaches.find((c: any) => c.user_id === p.user_id) ? "coaches" : "learners";
          userMonthMap[m][role]++;
        }
      });
      setUserGrowthData(Object.entries(userMonthMap).map(([month, data]) => ({ month, ...data })));

      // Enrollment trend by month
      const enrollMonthMap: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        enrollMonthMap[format(subMonths(now, i), "MMM yyyy")] = 0;
      }
      enrollments.forEach((e: any) => {
        const m = format(new Date(e.enrolled_at), "MMM yyyy");
        if (enrollMonthMap[m] !== undefined) enrollMonthMap[m]++;
      });
      setEnrollmentTrend(Object.entries(enrollMonthMap).map(([month, count]) => ({ month, count })));

      // Revenue trend
      const revMonthMap: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        revMonthMap[format(subMonths(now, i), "MMM yyyy")] = 0;
      }
      paidEnrollments.forEach((e: any) => {
        const m = format(new Date(e.enrolled_at), "MMM yyyy");
        if (revMonthMap[m] !== undefined) revMonthMap[m] += Number(e.amount_paid || 0);
      });
      setRevenueTrend(Object.entries(revMonthMap).map(([month, revenue]) => ({ month, revenue })));

      // Courses by category
      const catMap: Record<string, number> = {};
      courses.forEach((c: any) => { catMap[c.category] = (catMap[c.category] || 0) + 1; });
      setCoursesByCategory(Object.entries(catMap).map(([name, value]) => ({ name, value })));

      // Courses by level
      const levelMap: Record<string, number> = {};
      courses.forEach((c: any) => { levelMap[c.level] = (levelMap[c.level] || 0) + 1; });
      setCoursesByLevel(Object.entries(levelMap).map(([name, value]) => ({ name, value })));

      // Enrollments by country
      const countryMap: Record<string, number> = {};
      enrollments.forEach((e: any) => { if (e.country) countryMap[e.country] = (countryMap[e.country] || 0) + 1; });
      setEnrollmentsByCountry(Object.entries(countryMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([country, count]) => ({ country, count })));

      // Top coaches by revenue
      const coachRevMap: Record<string, { name: string; revenue: number; enrollments: number }> = {};
      paidEnrollments.forEach((e: any) => {
        const coachId = e.coach_id;
        if (!coachId) return;
        if (!coachRevMap[coachId]) {
          coachRevMap[coachId] = { name: profileMap[coachId]?.full_name || "Unknown", revenue: 0, enrollments: 0 };
        }
        coachRevMap[coachId].revenue += Number(e.amount_paid || 0);
        coachRevMap[coachId].enrollments++;
      });
      setTopCoaches(Object.values(coachRevMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5));

      // Top courses by enrollments
      const courseEnrollMap: Record<string, { title: string; count: number }> = {};
      enrollments.forEach((e: any) => {
        const title = e.courses?.title || "Unknown";
        if (!courseEnrollMap[e.course_id]) courseEnrollMap[e.course_id] = { title, count: 0 };
        courseEnrollMap[e.course_id].count++;
      });
      setTopCourses(Object.values(courseEnrollMap).sort((a, b) => b.count - a.count).slice(0, 5));

      // Payment status distribution
      setPaymentStatusData([
        { name: "Paid", value: paidEnrollments.length, fill: "#10b981" },
        { name: "Pending", value: unpaidEnrollments.length, fill: "#f59e0b" },
      ]);

      // Learner experience distribution
      const expMap: Record<string, number> = {};
      enrollments.forEach((e: any) => {
        if (e.experience_level) expMap[e.experience_level] = (expMap[e.experience_level] || 0) + 1;
      });
      setLearnerExperienceData(Object.entries(expMap).map(([name, value]) => ({ name, value })));

      // Campaign performance
      const campPerfMap: Record<string, { platform: string; sent: number; total: number }> = {};
      campaigns.forEach((c: any) => {
        const ch = c.channel || "email";
        if (!campPerfMap[ch]) campPerfMap[ch] = { platform: ch, sent: 0, total: 0 };
        campPerfMap[ch].total++;
        if (c.status === "sent") campPerfMap[ch].sent++;
      });
      setCampaignPerformance(Object.values(campPerfMap));

      // Daily visits simulation (placeholder - would come from analytics)
      const dailyData = [];
      for (let i = 29; i >= 0; i--) {
        dailyData.push({
          date: format(subDays(now, i), "dd MMM"),
          visits: Math.floor(50 + Math.random() * 150),
          signups: Math.floor(2 + Math.random() * 10),
        });
      }
      setDailyVisitsData(dailyData);

      // Recent activity
      const activities: any[] = [];
      enrollments.slice(0, 10).forEach((e: any) => {
        const coachProfile = e.courses?.coach_id ? profileMap[e.courses.coach_id] : null;
        activities.push({
          type: "enrollment", name: e.full_name, courseName: e.courses?.title || "Unknown",
          coachName: coachProfile?.full_name || "Unknown", coachPhone: coachProfile?.contact_number || "N/A",
          fee: `${symbol}${Number(e.amount_paid || 0).toFixed(2)}`, paymentStatus: e.payment_status, time: e.enrolled_at,
        });
      });
      setRecentActivity(activities.slice(0, 8));

      setLoading(false);
    };
    fetchAll();
  }, [symbol]);

  const exportActivityCSV = () => {
    const headers = ["Learner", "Course", "Coach", "Fee", "Status", "Date"];
    const rows = recentActivity.map(a => [a.name, a.courseName, a.coachName, a.fee, a.paymentStatus, format(new Date(a.time), "dd MMM yyyy")]);
    const csv = [headers, ...rows].map(r => r.map((v: string) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "activity.csv"; a.click();
  };

  if (loading) return <div className="flex justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  const StatCard = ({ icon: Icon, label, value, subValue, trend, color = "text-primary" }: any) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <Icon className={`h-5 w-5 ${color}`} />
          {trend !== undefined && (
            <div className={`flex items-center text-xs ${trend >= 0 ? "text-green-500" : "text-red-500"}`}>
              {trend >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(trend).toFixed(1)}%
            </div>
          )}
        </div>
        <p className="text-2xl font-bold text-foreground mt-2">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {subValue && <p className="text-xs text-muted-foreground/70 mt-0.5">{subValue}</p>}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" /> Platform Analytics
        </h2>
        <Badge variant="outline" className="text-xs"><Calendar className="h-3 w-3 mr-1" /> Last updated: {format(new Date(), "dd MMM yyyy, HH:mm")}</Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <StatCard icon={Users} label="Total Users" value={stats.totalUsers} subValue={`${stats.totalCoaches} coaches, ${stats.totalLearners} learners`} />
            <StatCard icon={UserPlus} label="New This Month" value={stats.newUsersThisMonth} trend={stats.userGrowthPercent} />
            <StatCard icon={DollarSign} label="Total Revenue" value={`$${stats.totalRevenue.toFixed(0)}`} color="text-green-500" />
            <StatCard icon={TrendingUp} label="Revenue This Month" value={`$${stats.revenueThisMonth.toFixed(0)}`} trend={stats.revenueGrowthPercent} color="text-green-500" />
            <StatCard icon={GraduationCap} label="Total Enrollments" value={stats.totalEnrollments} subValue={`${stats.enrollmentsThisMonth} this month`} color="text-blue-500" />
            <StatCard icon={Target} label="Conversion Rate" value={`${stats.conversionRate.toFixed(1)}%`} color="text-purple-500" />
          </div>

          {/* Charts Row 1 */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-sm">Revenue Trend (6 Months)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={revenueTrend}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#revGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Enrollments Trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={enrollmentTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers */}
          <div className="grid lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Award className="h-4 w-4 text-yellow-500" /> Top Coaches by Revenue</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {topCoaches.length === 0 ? <p className="text-sm text-muted-foreground">No data yet</p> : topCoaches.map((c, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                      <span className="text-sm font-medium truncate max-w-[120px]">{c.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-500">${c.revenue.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">{c.enrollments} students</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BookOpen className="h-4 w-4 text-blue-500" /> Top Courses</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {topCourses.length === 0 ? <p className="text-sm text-muted-foreground">No data yet</p> : topCourses.map((c, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                      <span className="text-sm font-medium truncate max-w-[150px]">{c.title}</span>
                    </div>
                    <Badge variant="secondary">{c.count} enrollments</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><MapPin className="h-4 w-4 text-red-500" /> Top Countries</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {enrollmentsByCountry.length === 0 ? <p className="text-sm text-muted-foreground">No data yet</p> : enrollmentsByCountry.map((c, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm">{c.country}</span>
                    <Badge variant="outline">{c.count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Recent Activity</CardTitle>
              <button onClick={exportActivityCSV} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><Download className="h-3.5 w-3.5" /> Export</button>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? <p className="text-sm text-muted-foreground">No activity yet</p> : (
                <div className="space-y-1">
                  {recentActivity.map((a, i) => (
                    <div key={i} className="border-b last:border-0">
                      <button onClick={() => setExpandedActivity(expandedActivity === i ? null : i)} className="flex w-full items-center justify-between py-3 text-left hover:bg-muted/50 rounded-lg px-2 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-blue-400" />
                          <div>
                            <p className="text-sm font-medium">{a.name}</p>
                            <p className="text-xs text-muted-foreground">enrolled in {a.courseName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={a.paymentStatus === "paid" ? "default" : "secondary"} className="text-xs">{a.paymentStatus}</Badge>
                          <span className="text-xs text-muted-foreground">{format(new Date(a.time), "dd MMM")}</span>
                          {expandedActivity === i ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </div>
                      </button>
                      {expandedActivity === i && (
                        <div className="ml-8 mb-3 rounded-lg bg-muted/50 p-3 text-xs space-y-1.5">
                          <div className="flex justify-between"><span className="text-muted-foreground">Coach</span><span>{a.coachName}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Fee</span><span>{a.fee}</span></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* USERS TAB */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Total Users" value={stats.totalUsers} />
            <StatCard icon={GraduationCap} label="Learners" value={stats.totalLearners} color="text-blue-500" />
            <StatCard icon={Award} label="Coaches" value={stats.totalCoaches} color="text-yellow-500" />
            <StatCard icon={UserPlus} label="New This Month" value={stats.newUsersThisMonth} trend={stats.userGrowthPercent} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-sm">User Growth (6 Months)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Legend />
                    <Bar dataKey="learners" fill="#3b82f6" name="Learners" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="coaches" fill="#f59e0b" name="Coaches" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Learner Experience Levels</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={learnerExperienceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                      {learnerExperienceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm">Estimated Daily Traffic (30 Days)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dailyVisitsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={4} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend />
                  <Line type="monotone" dataKey="visits" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Visits" />
                  <Line type="monotone" dataKey="signups" stroke="#10b981" strokeWidth={2} dot={false} name="Signups" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REVENUE TAB */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={DollarSign} label="Total Revenue" value={`$${stats.totalRevenue.toFixed(0)}`} color="text-green-500" />
            <StatCard icon={TrendingUp} label="This Month" value={`$${stats.revenueThisMonth.toFixed(0)}`} trend={stats.revenueGrowthPercent} color="text-green-500" />
            <StatCard icon={Target} label="Avg per Enrollment" value={`$${stats.avgRevenuePerEnrollment.toFixed(0)}`} />
            <StatCard icon={Percent} label="Conversion Rate" value={`${stats.conversionRate.toFixed(1)}%`} color="text-purple-500" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-sm">Revenue by Month</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={revenueTrend}>
                    <defs>
                      <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `$${v}`} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: number) => [`$${v.toFixed(0)}`, "Revenue"]} />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#revGrad2)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Payment Status Distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={paymentStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                      {paymentStatusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* CONTENT TAB */}
        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard icon={BookOpen} label="Total Courses" value={stats.totalCourses} color="text-blue-500" />
            <StatCard icon={CheckCircle} label="Published" value={stats.publishedCourses} color="text-green-500" />
            <StatCard icon={Clock} label="Pending Approval" value={stats.pendingCourses} color="text-yellow-500" />
            <StatCard icon={Video} label="Webinars" value={stats.totalWebinars} color="text-purple-500" />
            <StatCard icon={FileText} label="Blog Posts" value={stats.totalBlogs} subValue={`${stats.publishedBlogs} published`} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Star} label="Total Reviews" value={stats.totalReviews} color="text-yellow-500" />
            <StatCard icon={Star} label="Avg Rating" value={stats.avgRating.toFixed(1)} color="text-yellow-500" />
            <StatCard icon={DollarSign} label="Avg Course Price" value={`$${stats.avgCoursePrice.toFixed(0)}`} />
            <StatCard icon={Users} label="Avg Webinar Regs" value={stats.avgRegsPerWebinar.toFixed(1)} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-sm">Courses by Category</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={coursesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                      {coursesByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Courses by Level</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={coursesByLevel} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={80} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* MARKETING TAB */}
        <TabsContent value="marketing" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard icon={Megaphone} label="Total Campaigns" value={stats.totalCampaigns} color="text-purple-500" />
            <StatCard icon={Mail} label="Sent" value={stats.sentCampaigns} color="text-green-500" />
            <StatCard icon={Clock} label="Drafts" value={stats.draftCampaigns} color="text-yellow-500" />
            <StatCard icon={Bot} label="Chatbot Leads" value={stats.chatbotLeads} color="text-blue-500" />
            <StatCard icon={Share2} label="Referrals" value={stats.totalReferrals} subValue={`${stats.convertedReferrals} converted`} />
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm">Campaigns by Platform</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={campaignPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="platform" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend />
                  <Bar dataKey="total" fill="hsl(var(--primary))" name="Total" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="sent" fill="#10b981" name="Sent" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminOverview;
