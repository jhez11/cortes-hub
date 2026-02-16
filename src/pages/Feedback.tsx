import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BottomNav } from '@/components/BottomNav';
import { AuthGuard } from '@/components/AuthGuard';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, MessageSquare, Star, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const Feedback = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('You must be logged in to perform this action.');
      return;
    }

    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from('feedback').insert({
      user_id: user.id,
      subject: subject.trim(),
      message: message.trim(),
      rating: rating || null,
      is_anonymous: false,
    });

    if (error) {
      toast.error('Failed to submit feedback');
    } else {
      setIsSuccess(true);
      toast.success('Thank you for your feedback!');
    }

    setIsSubmitting(false);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="app-container">
          <div className="px-4 pt-12 flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6 animate-scale-in">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-center mb-2">Thank You!</h1>
            <p className="text-muted-foreground text-center mb-8">
              Your feedback helps us improve our services for the community.
            </p>
            <Button onClick={() => navigate('/')}>
              Go Home
            </Button>
          </div>
        </div>
        <BottomNav currentPath="/services" onNavigate={(path) => navigate(path)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="app-container">
        {/* Header */}
        <div className="hero-gradient px-4 pt-12 pb-8" style={{ background: 'var(--gradient-accent)' }}>
          <button
            onClick={() => navigate('/services')}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-white text-xl font-bold">Feedback</h1>
              <p className="text-white/70 text-sm">Share your thoughts with us</p>
            </div>
          </div>
        </div>

        {/* Curved transition */}
        <div className="h-6 bg-background rounded-t-3xl -mt-6 relative z-10" />

        {/* Form - Protected by AuthGuard */}
        <div className="px-4 -mt-2">
          <AuthGuard fallback="message">
            <Card variant="elevated" className="animate-slide-up">
              <CardContent className="p-5">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">How would you rate our services?</label>
                    <div className="flex gap-2 justify-center py-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 transition-transform hover:scale-110"
                        >
                          <Star
                            className={cn(
                              "h-8 w-8 transition-colors",
                              star <= rating
                                ? "text-warning fill-warning"
                                : "text-muted-foreground"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subject *</label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="What's your feedback about?"
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Message *</label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us more..."
                      rows={4}
                      maxLength={1000}
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Submit Feedback'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </AuthGuard>
        </div>
      </div>

      <BottomNav currentPath="/services" onNavigate={(path) => navigate(path)} />
    </div>
  );
};

export default Feedback;
