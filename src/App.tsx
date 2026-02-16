import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Services from "./pages/Services";
import Updates from "./pages/Updates";
import Profile from "./pages/Profile";
import RequestService from "./pages/RequestService";
import ReportIssue from "./pages/ReportIssue";
import MyRequests from "./pages/MyRequests";
import Feedback from "./pages/Feedback";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRequests from "./pages/AdminRequests";
import AdminUsers from "./pages/AdminUsers";
import AdminTouristSpots from "./pages/AdminTouristSpots";
import AdminFeedback from "./pages/AdminFeedback";
import AdminAnnouncements from "./pages/AdminAnnouncements";
import AdminPosts from "./pages/AdminPosts";
import TouristSpots from "./pages/TouristSpots";
import CommunityWall from "./pages/CommunityWall";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/services" element={<Services />} />
            <Route path="/updates" element={<Updates />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/request-service" element={<RequestService />} />
            <Route path="/report-issue" element={<ReportIssue />} />
            <Route path="/my-requests" element={<MyRequests />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/community" element={<CommunityWall />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/requests" element={<AdminRequests />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/announcements" element={<AdminAnnouncements />} />
            <Route path="/admin/posts" element={<AdminPosts />} />
            <Route path="/admin/tourist-spots" element={<AdminTouristSpots />} />
            <Route path="/admin/feedback" element={<AdminFeedback />} />
            <Route path="/tourist-spots" element={<TouristSpots />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
