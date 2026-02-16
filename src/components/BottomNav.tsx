import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Home, FileText, Bell, User, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface BottomNavProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export const BottomNav = ({ currentPath }: BottomNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const activePath = currentPath || location.pathname;

  // Fetch unread announcements count (announcements from last 7 days)
  const { data: announcementCount } = useQuery({
    queryKey: ['announcement-count'],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count, error } = await supabase
        .from('announcements')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .gte('published_at', sevenDaysAgo.toISOString());
      
      if (error) return 0;
      return count || 0;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: FileText, label: "Services", path: "/services" },
    { icon: Newspaper, label: "Wall", path: "/community" },
    { icon: Bell, label: "Updates", path: "/updates", badge: announcementCount && announcementCount > 0 ? announcementCount : undefined },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border safe-area-pb z-50">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = activePath === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path + item.label}
              onClick={() => navigate(item.path)}
              className={cn(
                "relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200",
                isActive ? "text-primary bg-secondary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5", isActive && "animate-scale-in")} />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center bg-accent text-accent-foreground text-[10px] font-bold rounded-full">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
