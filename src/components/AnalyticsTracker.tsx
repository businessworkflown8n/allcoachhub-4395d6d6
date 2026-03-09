import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView, trackScrollDepth, trackSectionView, trackTimeOnPage } from "@/lib/analytics";

/**
 * Global analytics tracker component.
 * Handles: page views, scroll depth, section visibility, time on page.
 * Place once in App.tsx inside <BrowserRouter>.
 */
const AnalyticsTracker = () => {
  const location = useLocation();
  const scrollMilestones = useRef(new Set<number>());
  const pageEntryTime = useRef(Date.now());
  const lastPath = useRef("");

  // Track page views on route change
  useEffect(() => {
    if (location.pathname !== lastPath.current) {
      // Track time on previous page
      if (lastPath.current) {
        const timeSpent = Math.round((Date.now() - pageEntryTime.current) / 1000);
        if (timeSpent > 2) {
          trackTimeOnPage(lastPath.current, timeSpent);
        }
      }
      lastPath.current = location.pathname;
      pageEntryTime.current = Date.now();
      scrollMilestones.current.clear();
      trackPageView(location.pathname + location.search);
    }
  }, [location]);

  // Scroll depth tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const percent = Math.round((scrollTop / docHeight) * 100);

      const milestones = [25, 50, 75, 90, 100];
      for (const m of milestones) {
        if (percent >= m && !scrollMilestones.current.has(m)) {
          scrollMilestones.current.add(m);
          trackScrollDepth(m, location.pathname);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  // Section visibility tracking via IntersectionObserver
  useEffect(() => {
    const sectionIds = [
      "hero", "categories", "coaches", "courses",
      "how-it-works", "testimonials", "blogs", "cta"
    ];
    const observedSections = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !observedSections.has(entry.target.id)) {
            observedSections.add(entry.target.id);
            trackSectionView(entry.target.id);
          }
        });
      },
      { threshold: 0.3 }
    );

    // Delay to let DOM render
    const timer = setTimeout(() => {
      sectionIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
    }, 1000);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [location.pathname]);

  // Track time on page when user leaves
  useEffect(() => {
    const handleBeforeUnload = () => {
      const timeSpent = Math.round((Date.now() - pageEntryTime.current) / 1000);
      if (timeSpent > 2) {
        trackTimeOnPage(location.pathname, timeSpent);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [location.pathname]);

  return null;
};

export default AnalyticsTracker;
