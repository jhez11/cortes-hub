import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader } from "@/components/ui/card";
import { ChevronRight, Megaphone, AlertTriangle, Calendar, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AnnouncementDetailDialog } from "@/components/AnnouncementDetailDialog";

interface Announcement {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  type: "general" | "urgent" | "event";
  published_at: string;
  image_url: string | null;
}

const typeConfig = {
  general: { icon: Megaphone, color: "bg-secondary text-secondary-foreground" },
  urgent: { icon: AlertTriangle, color: "bg-emergency/10 text-emergency" },
  event: { icon: Calendar, color: "bg-success/10 text-success" },
};

export const AnnouncementsFeed = () => {
  const navigate = useNavigate();
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { data: announcements, isLoading } = useQuery({
    queryKey: ['announcements-feed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('published_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data as Announcement[];
    },
  });

  return (
    <section className="px-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Announcements</h2>
        <button 
          onClick={() => navigate('/updates')}
          className="text-sm text-primary font-medium flex items-center gap-1"
        >
          View All <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !announcements || announcements.length === 0 ? (
          <Card variant="flat" className="p-6 text-center">
            <Megaphone className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No announcements yet</p>
          </Card>
        ) : (
          announcements.map((announcement, index) => {
            const config = typeConfig[announcement.type];
            const Icon = config.icon;

            return (
              <Card 
                key={announcement.id} 
                variant="elevated"
                className="animate-slide-up cursor-pointer"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => {
                  setSelectedAnnouncement(announcement);
                  setIsDetailOpen(true);
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-xl", config.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-sm line-clamp-1">{announcement.title}</h3>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {format(new Date(announcement.published_at), 'MMM d')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {announcement.excerpt || announcement.content}
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })
        )}
      </div>

      <AnnouncementDetailDialog
        announcement={selectedAnnouncement}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </section>
  );
};
