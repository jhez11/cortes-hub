import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BottomNav } from '@/components/BottomNav';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostDetailDialog } from '@/components/PostDetailDialog';
import { 
  ArrowLeft, 
  Heart, 
  Clock, 
  Megaphone, 
  Building2, 
  AlertCircle,
  User,
  Plus,
  Filter,
  X,
  Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
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

const reportCategories = [
  'Road Damage',
  'Garbage',
  'Flooding',
  'Street Light',
  'Water Supply',
  'Public Safety',
  'Other',
];

const allCategories = [
  'Road Damage',
  'Garbage',
  'Flooding',
  'Street Light',
  'Water Supply',
  'Public Safety',
  'Infrastructure',
  'Health',
  'Education',
  'Environment',
  'Social Services',
  'Events',
  'General',
  'Other',
];

type FilterTab = 'all' | 'reports' | 'government';

const CommunityWall = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [sessionId] = useState(() => {
    let id = localStorage.getItem('wall_session_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('wall_session_id', id);
    }
    return id;
  });

  // Fetch all posts
  const { data: posts, isLoading } = useQuery({
    queryKey: ['community-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Post[];
    },
  });

  // Get unique categories from posts for filter dropdown
  const availableCategories = [...new Set(posts?.map(p => p.category).filter(Boolean) || [])];

  // Filter posts based on active tab, category, and search
  const filteredPosts = posts?.filter((post) => {
    let passesTabFilter = true;
    if (activeFilter === 'reports') {
      passesTabFilter = post.post_type === 'report';
    } else if (activeFilter === 'government') {
      passesTabFilter = post.post_type === 'announcement' || post.post_type === 'project';
    }

    const passesCategoryFilter = !selectedCategory || post.category === selectedCategory;

    const q = searchQuery.toLowerCase().trim();
    const passesSearch = !q || 
      post.title.toLowerCase().includes(q) || 
      post.content.toLowerCase().includes(q) ||
      (post.category?.toLowerCase().includes(q) ?? false);

    return passesTabFilter && passesCategoryFilter && passesSearch;
  });

  // Fetch likes
  const { data: likesData } = useQuery({
    queryKey: ['post-likes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_likes')
        .select('post_id, user_id, session_id');
      if (error) throw error;
      return data;
    },
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: { title: string; content: string; category: string }) => {
      const { error } = await supabase
        .from('posts')
        .insert({
          title: postData.title,
          content: postData.content,
          category: postData.category,
          post_type: 'report',
          is_anonymous: true,
          created_by: user?.id || null,
          created_by_role: 'user',
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      setIsDialogOpen(false);
      setTitle('');
      setContent('');
      setCategory('');
      toast.success('Report submitted successfully!');
    },
    onError: (error) => {
      toast.error('Failed to submit report');
      console.error(error);
    },
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (user) {
        const { error } = await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('post_likes')
          .insert({ post_id: postId, session_id: sessionId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-likes'] });
    },
  });

  // Unlike mutation
  const unlikeMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (user) {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('session_id', sessionId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-likes'] });
    },
  });

  const getLikesCount = (postId: string) => {
    return likesData?.filter((like) => like.post_id === postId).length || 0;
  };

  const isLikedByUser = (postId: string) => {
    if (!likesData) return false;
    if (user) {
      return likesData.some((like) => like.post_id === postId && like.user_id === user.id);
    }
    return likesData.some((like) => like.post_id === postId && like.session_id === sessionId);
  };

  const handleLikeToggle = (postId: string) => {
    if (isLikedByUser(postId)) {
      unlikeMutation.mutate(postId);
    } else {
      likeMutation.mutate(postId);
    }
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !category) {
      toast.error('Please fill in all fields');
      return;
    }
    createPostMutation.mutate({ title, content, category });
  };

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setIsDetailOpen(true);
  };

  const clearCategoryFilter = () => {
    setSelectedCategory(null);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="app-container">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-bold">Community Wall</h1>
                <p className="text-xs text-muted-foreground">Reports, announcements & projects</p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  Report
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Submit Anonymous Report</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmitReport} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Brief title of the issue"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {reportCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Description</Label>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Describe the issue in detail..."
                      rows={4}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createPostMutation.isPending}
                  >
                    {createPostMutation.isPending ? 'Submitting...' : 'Submit Report'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Search Bar */}
        <div className="px-4 pt-3">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 h-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-4">
          <div className="flex items-center gap-2">
            <Tabs 
              value={activeFilter} 
              onValueChange={(v) => {
                setActiveFilter(v as FilterTab);
                setSelectedCategory(null); // Reset category when changing tabs
              }}
              className="flex-1"
            >
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="reports" className="gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Reports
                </TabsTrigger>
                <TabsTrigger value="government" className="gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  Government
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Category Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant={selectedCategory ? "default" : "outline"} 
                  size="icon"
                  className="shrink-0"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {selectedCategory && (
                  <>
                    <DropdownMenuItem onClick={clearCategoryFilter} className="text-destructive">
                      <X className="h-4 w-4 mr-2" />
                      Clear Filter
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {availableCategories.length === 0 ? (
                  <DropdownMenuItem disabled>No categories available</DropdownMenuItem>
                ) : (
                  availableCategories.map((cat) => (
                    <DropdownMenuItem 
                      key={cat} 
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(selectedCategory === cat && "bg-accent")}
                    >
                      {cat}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Active Category Badge */}
          {selectedCategory && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Filtered by:</span>
              <Badge 
                variant="secondary" 
                className="gap-1 cursor-pointer hover:bg-secondary/80"
                onClick={clearCategoryFilter}
              >
                {selectedCategory}
                <X className="h-3 w-3" />
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <main className="p-4 space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading posts...</div>
          ) : filteredPosts?.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {selectedCategory 
                  ? `No posts found in "${selectedCategory}" category.`
                  : activeFilter === 'all' 
                  ? 'No posts yet. Be the first to submit a report!'
                  : activeFilter === 'reports'
                  ? 'No community reports yet.'
                  : 'No government posts yet.'}
              </CardContent>
            </Card>
          ) : (
            filteredPosts?.map((post) => {
              const postType = post.post_type as string;
              const Icon = postTypeIcons[postType] || AlertCircle;
              const likesCount = getLikesCount(post.id);
              const liked = isLikedByUser(post.id);
              const isAdminPost = postType === 'announcement' || postType === 'project';

              return (
                <Card 
                  key={post.id} 
                  className={cn(
                    "overflow-hidden transition-all cursor-pointer hover:shadow-md",
                    isAdminPost && "border-primary/30 bg-primary/5"
                  )}
                  onClick={() => handlePostClick(post)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-xl",
                        isAdminPost ? "bg-primary/20" : "bg-muted"
                      )}>
                        <Icon className={cn(
                          "h-5 w-5",
                          isAdminPost ? "text-primary" : "text-muted-foreground"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2 mb-1">
                          <h3 className="font-semibold text-sm line-clamp-1">{post.title}</h3>
                          <Badge className={cn('text-xs', postTypeColors[postType])}>
                            {postTypeLabels[postType]}
                          </Badge>
                        </div>
                        {post.category && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {post.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {post.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {post.is_anonymous && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Anonymous
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(post.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'gap-1.5 text-muted-foreground hover:text-destructive',
                          liked && 'text-destructive'
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLikeToggle(post.id);
                        }}
                        disabled={likeMutation.isPending || unlikeMutation.isPending}
                      >
                        <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
                        <span>{likesCount}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </main>
      </div>

      {/* Post Detail Dialog */}
      <PostDetailDialog
        post={selectedPost}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        likesCount={selectedPost ? getLikesCount(selectedPost.id) : 0}
        isLiked={selectedPost ? isLikedByUser(selectedPost.id) : false}
        onLikeToggle={handleLikeToggle}
        isLikeLoading={likeMutation.isPending || unlikeMutation.isPending}
      />

      <BottomNav />
    </div>
  );
};

export default CommunityWall;
