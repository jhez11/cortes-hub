import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Megaphone, 
  Building2, 
  AlertCircle,
  Heart,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type PostType = 'report' | 'announcement' | 'project';

interface Post {
  id: string;
  title: string;
  content: string;
  category: string | null;
  post_type: PostType;
  is_anonymous: boolean;
  created_by: string | null;
  created_by_role: string | null;
  created_at: string;
  updated_at: string;
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

const categories = [
  'Infrastructure',
  'Health',
  'Education',
  'Environment',
  'Public Safety',
  'Social Services',
  'Events',
  'General',
];

const AdminPosts = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<PostType>('announcement');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [postType, setPostType] = useState<PostType>('announcement');

  // Fetch posts
  const { data: posts, isLoading } = useQuery({
    queryKey: ['admin-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Post[];
    },
  });

  // Fetch likes count for each post
  const { data: likesData } = useQuery({
    queryKey: ['admin-post-likes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_likes')
        .select('post_id');
      if (error) throw error;
      return data;
    },
  });

  const getLikesCount = (postId: string) => {
    return likesData?.filter((like) => like.post_id === postId).length || 0;
  };

  // Create post mutation
  const createMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; category: string; post_type: PostType }) => {
      const { error } = await supabase.from('posts').insert({
        title: data.title,
        content: data.content,
        category: data.category,
        post_type: data.post_type,
        is_anonymous: false,
        created_by: user?.id,
        created_by_role: 'admin',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      setIsCreateOpen(false);
      resetForm();
      toast.success('Post created successfully!');
    },
    onError: () => toast.error('Failed to create post'),
  });

  // Update post mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; title: string; content: string; category: string; post_type: PostType }) => {
      const { error } = await supabase
        .from('posts')
        .update({
          title: data.title,
          content: data.content,
          category: data.category,
          post_type: data.post_type,
        })
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      setIsEditOpen(false);
      setEditingPost(null);
      resetForm();
      toast.success('Post updated successfully!');
    },
    onError: () => toast.error('Failed to update post'),
  });

  // Delete post mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      setDeleteId(null);
      toast.success('Post deleted successfully!');
    },
    onError: () => toast.error('Failed to delete post'),
  });

  const resetForm = () => {
    setTitle('');
    setContent('');
    setCategory('');
    setPostType('announcement');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    createMutation.mutate({ title, content, category, post_type: postType });
  };

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    setTitle(post.title);
    setContent(post.content);
    setCategory(post.category || '');
    setPostType(post.post_type);
    setIsEditOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost || !title.trim() || !content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    updateMutation.mutate({ 
      id: editingPost.id, 
      title, 
      content, 
      category, 
      post_type: postType 
    });
  };

  const filteredPosts = posts?.filter((post) => {
    if (activeTab === 'report') return post.post_type === 'report';
    if (activeTab === 'announcement') return post.post_type === 'announcement';
    if (activeTab === 'project') return post.post_type === 'project';
    return true;
  });

  const PostForm = ({ onSubmit, isEdit = false }: { onSubmit: (e: React.FormEvent) => void; isEdit?: boolean }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="postType">Post Type</Label>
        <Select value={postType} onValueChange={(v) => setPostType(v as PostType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="announcement">Announcement</SelectItem>
            <SelectItem value="project">Municipal Project</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter post title"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">Content *</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter post content..."
          rows={5}
        />
      </div>
      <Button 
        type="submit" 
        className="w-full"
        disabled={createMutation.isPending || updateMutation.isPending}
      >
        {isEdit ? 'Update Post' : 'Create Post'}
      </Button>
    </form>
  );

  return (
    <AdminLayout title="Community Posts" subtitle="Manage announcements, projects, and reports">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PostType)}>
            <TabsList>
              <TabsTrigger value="announcement" className="gap-2">
                <Megaphone className="h-4 w-4" />
                Announcements
              </TabsTrigger>
              <TabsTrigger value="project" className="gap-2">
                <Building2 className="h-4 w-4" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="report" className="gap-2">
                <AlertCircle className="h-4 w-4" />
                Reports
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Post
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Post</DialogTitle>
              </DialogHeader>
              <PostForm onSubmit={handleCreate} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Posts Grid */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading posts...</div>
        ) : filteredPosts?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No {activeTab}s found. Create one to get started!
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredPosts?.map((post) => {
              const Icon = postTypeIcons[post.post_type] || AlertCircle;
              const likesCount = getLikesCount(post.id);

              return (
                <Card key={post.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-xl",
                          post.post_type === 'report' ? "bg-muted" : "bg-primary/10"
                        )}>
                          <Icon className={cn(
                            "h-5 w-5",
                            post.post_type === 'report' ? "text-muted-foreground" : "text-primary"
                          )} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-base">{post.title}</CardTitle>
                            <Badge className={cn('text-xs', postTypeColors[post.post_type])}>
                              {post.post_type === 'announcement' ? 'Announcement' : 
                               post.post_type === 'project' ? 'Municipal Project' : 'Community Report'}
                            </Badge>
                            {post.is_anonymous && (
                              <Badge variant="outline" className="text-xs">Anonymous</Badge>
                            )}
                          </div>
                          {post.category && (
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              {post.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(post)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(post.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(post.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {likesCount} likes
                      </span>
                      <span className="text-xs">
                        By: {post.created_by_role === 'admin' ? 'Admin' : post.is_anonymous ? 'Anonymous' : 'User'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) { setEditingPost(null); resetForm(); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Post</DialogTitle>
            </DialogHeader>
            <PostForm onSubmit={handleUpdate} isEdit />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Post?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the post.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminPosts;
