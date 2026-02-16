import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/BottomNav';
import { AnnouncementDetailDialog } from '@/components/AnnouncementDetailDialog';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Megaphone, AlertTriangle, Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Announcement {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  type: 'general' | 'urgent' | 'event';
  published_at: string;
  image_url: string | null;
}

const typeConfig = {
  general: { icon: Megaphone, color: "bg-secondary text-secondary-foreground", label: "General" },
  urgent: { icon: AlertTriangle, color: "bg-emergency/10 text-emergency", label: "Urgent" },
  event: { icon: Calendar, color: "bg-success/10 text-success", label: "Event" },
};

const Updates = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'general' | 'urgent' | 'event'>('all');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('published_at', { ascending: false });

    if (!error && data) {
      setAnnouncements(data);
    }
    setIsLoading(false);
  };

  const filteredAnnouncements = filter === 'all' 
    ? announcements 
    : announcements.filter(a => a.type === filter);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="app-container">
        {/* Header */}
        <div className="px-4 pt-12 pb-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <h1 className="text-2xl font-bold">Updates</h1>
          <p className="text-muted-foreground text-sm mt-1">Latest news and announcements</p>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 pb-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {(['all', 'urgent', 'general', 'event'] as const).map((type) => (
              <Button
                key={type}
                variant={filter === type ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setFilter(type)}
                className="flex-shrink-0"
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Announcements List */}
        <div className="px-4 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <Card variant="flat" className="p-8 text-center">
              <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No announcements yet</p>
            </Card>
          ) : (
            filteredAnnouncements.map((announcement, index) => {
              const config = typeConfig[announcement.type];
              const Icon = config.icon;

              return (
                <Card 
                  key={announcement.id} 
                  variant="elevated"
                  className="animate-slide-up cursor-pointer hover:shadow-md transition-shadow"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => {
                    setSelectedAnnouncement(announcement);
                    setIsDetailOpen(true);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-xl flex-shrink-0", config.color)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", config.color)}>
                            {config.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(announcement.published_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                        {announcement.image_url && (
                          <div className="mt-2 mb-2 rounded-lg overflow-hidden">
                            <img 
                              src={announcement.image_url} 
                              alt={announcement.title}
                              className="w-full h-32 object-cover"
                            />
                          </div>
                        )}
                        <h3 className="font-semibold mt-2">{announcement.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                          {announcement.excerpt || announcement.content}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <AnnouncementDetailDialog
        announcement={selectedAnnouncement}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />

      <BottomNav currentPath="/updates" onNavigate={(path) => navigate(path)} />
    </div>
  );
};

export default Updates;
