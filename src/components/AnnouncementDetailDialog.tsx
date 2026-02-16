import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Megaphone, AlertTriangle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Announcement {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  type: 'general' | 'urgent' | 'event';
  published_at: string;
  image_url?: string | null;
}

const typeConfig = {
  general: { icon: Megaphone, color: 'bg-secondary text-secondary-foreground', label: 'General' },
  urgent: { icon: AlertTriangle, color: 'bg-emergency/10 text-emergency', label: 'Urgent' },
  event: { icon: Calendar, color: 'bg-success/10 text-success', label: 'Event' },
};

interface AnnouncementDetailDialogProps {
  announcement: Announcement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AnnouncementDetailDialog = ({
  announcement,
  open,
  onOpenChange,
}: AnnouncementDetailDialogProps) => {
  if (!announcement) return null;

  const config = typeConfig[announcement.type];
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge className={cn('text-xs', config.color)}>{config.label}</Badge>
            <span className="text-xs text-muted-foreground">
              {format(new Date(announcement.published_at), 'MMMM d, yyyy')}
            </span>
          </div>
          <DialogTitle className="text-lg leading-snug">{announcement.title}</DialogTitle>
        </DialogHeader>

        {announcement.image_url && (
          <div className="rounded-lg overflow-hidden border border-border">
            <img
              src={announcement.image_url}
              alt={announcement.title}
              className="w-full h-auto max-h-64 object-cover"
            />
          </div>
        )}

        <div className="space-y-3">
          {announcement.excerpt && (
            <p className="text-sm font-medium text-muted-foreground italic">
              {announcement.excerpt}
            </p>
          )}
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {announcement.content}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
