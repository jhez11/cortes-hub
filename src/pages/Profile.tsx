import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BottomNav } from '@/components/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit2, 
  LogOut, 
  Shield,
  Loader2,
  Save
} from 'lucide-react';

interface Profile {
  full_name: string | null;
  phone: string | null;
  address: string | null;
  barangay: string | null;
  avatar_url: string | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, isAdmin, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (user) {
      fetchProfile();
    }
  }, [user, authLoading, navigate]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setProfile(data);
      setEditedProfile(data);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!user || !editedProfile) return;

    setIsSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: editedProfile.full_name,
        phone: editedProfile.phone,
        address: editedProfile.address,
        barangay: editedProfile.barangay,
      })
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to update profile');
    } else {
      setProfile(editedProfile);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    }
    setIsSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    toast.success('Signed out successfully');
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || user.email?.[0].toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="app-container">
        {/* Header */}
        <div className="hero-gradient px-4 pt-12 pb-16">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-4 border-white/30">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-white text-xl font-bold">
                {profile?.full_name || 'User'}
              </h1>
              <p className="text-white/70 text-sm">{user.email}</p>
              {isAdmin && (
                <div className="flex items-center gap-1 mt-1">
                  <Shield className="h-3 w-3 text-accent" />
                  <span className="text-accent text-xs font-medium">Administrator</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Curved transition */}
        <div className="h-6 bg-background rounded-t-3xl -mt-6 relative z-10" />

        {/* Profile Card */}
        <div className="px-4 -mt-2 space-y-4">
          <Card variant="elevated" className="animate-slide-up">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Profile Information</CardTitle>
                {!isEditing ? (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => {
                      setIsEditing(false);
                      setEditedProfile(profile);
                    }}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                      Save
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" /> Full Name
                </label>
                {isEditing ? (
                  <Input
                    value={editedProfile?.full_name || ''}
                    onChange={(e) => setEditedProfile(prev => prev ? {...prev, full_name: e.target.value} : null)}
                    placeholder="Enter your full name"
                  />
                ) : (
                  <p className="font-medium">{profile?.full_name || 'Not set'}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Email
                </label>
                <p className="font-medium">{user.email}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Phone
                </label>
                {isEditing ? (
                  <Input
                    value={editedProfile?.phone || ''}
                    onChange={(e) => setEditedProfile(prev => prev ? {...prev, phone: e.target.value} : null)}
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <p className="font-medium">{profile?.phone || 'Not set'}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Address
                </label>
                {isEditing ? (
                  <Input
                    value={editedProfile?.address || ''}
                    onChange={(e) => setEditedProfile(prev => prev ? {...prev, address: e.target.value} : null)}
                    placeholder="Enter your address"
                  />
                ) : (
                  <p className="font-medium">{profile?.address || 'Not set'}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Barangay
                </label>
                {isEditing ? (
                  <Input
                    value={editedProfile?.barangay || ''}
                    onChange={(e) => setEditedProfile(prev => prev ? {...prev, barangay: e.target.value} : null)}
                    placeholder="Enter your barangay"
                  />
                ) : (
                  <p className="font-medium">{profile?.barangay || 'Not set'}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Admin Dashboard Link */}
          {isAdmin && (
            <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: '100ms' }}>
              <CardContent className="p-4">
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => navigate('/admin')}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Dashboard
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Sign Out */}
          <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: '150ms' }}>
            <CardContent className="p-4">
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNav currentPath="/profile" onNavigate={(path) => navigate(path)} />
    </div>
  );
};

export default Profile;
