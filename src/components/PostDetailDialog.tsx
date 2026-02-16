import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  Clock, 
  User, 
  Megaphone, 
  Building2, 
  AlertCircle,
  Share2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Post {
  id: string;
  title: string;
  content: string;
  category: string | null;
  post_type: string;
  is_anonymous: boolean;
  created_by_role: string | null;
  created_at: string;
}

const postTypeIcons: Record<string, React.ElementType> = {
  report: AlertCircle,
  announcement: Megaphone,
  project: Building2,
};

const postTypeColors: Record<string, string> = {
  report: 'bg-warning/10 text-warning border-warning/20',
  announcement: 'bg-primary/10 text-primary border-primary/20',
  project: 'bg-success/10 text-success border-success/20',
};

const postTypeLabels: Record<string, string> = {
  report: 'Community Report',
  announcement: 'Announcement',
  project: 'Municipal Project',
};

interface PostDetailDialogProps {
  post: Post | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  likesCount: number;
  isLiked: boolean;
  onLikeToggle: (postId: string) => void;
  isLikeLoading: boolean;
}

export const PostDetailDialog = ({
  post,
  open,
  onOpenChange,
  likesCount,
  isLiked,
  onLikeToggle,
  isLikeLoading,
}: PostDetailDialogProps) => {
  if (!post) return null;

  const Icon = postTypeIcons[post.post_type] || AlertCircle;
  const isAdminPost = post.post_type === 'announcement' || post.post_type === 'project';

  const handleShare = async () => {
    try {
      await navigator.share({
        title: post.title,
        text: post.content.substring(0, 100) + '...',
        url: window.location.href,
      });
    } catch {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(`${post.title}\n\n${post.content}`);
      toast.success('Copied to clipboard!');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className={cn(
              "p-3 rounded-xl shrink-0",
              isAdminPost ? "bg-primary/20" : "bg-muted"
            )}>
              <Icon className={cn(
                "h-6 w-6",
                isAdminPost ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-bold leading-tight mb-2">
                {post.title}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn('text-xs', postTypeColors[post.post_type])}>
                  {postTypeLabels[post.post_type]}
                </Badge>
                {post.category && (
                  <Badge variant="outline" className="text-xs">
                    {post.category}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="mt-4 space-y-4">
          <div className="prose prose-sm max-w-none">
            <p className="text-foreground whitespace-pre-wrap leading-relaxed">
              {post.content}
            </p>
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground py-3 border-t border-b border-border">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {format(new Date(post.created_at), 'MMMM d, yyyy • h:mm a')}
            </span>
            {post.is_anonymous && (
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                Anonymous
              </span>
            )}
            {post.created_by_role === 'admin' && (
              <Badge variant="secondary" className="text-xs">
                Posted by Admin
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'gap-2 text-muted-foreground hover:text-destructive',
                isLiked && 'text-destructive'
              )}
              onClick={() => onLikeToggle(post.id)}
              disabled={isLikeLoading}
            >
              <Heart className={cn('h-5 w-5', isLiked && 'fill-current')} />
              <span>{likesCount} {likesCount === 1 ? 'like' : 'likes'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
