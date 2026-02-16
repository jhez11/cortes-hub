import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, Clock, Shield, UserCheck, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { AdminLayout } from '@/components/admin/AdminLayout';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;
type LoginActivity = Tables<'user_login_activity'>;

interface UserWithRole extends Profile {
  role?: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loginActivity, setLoginActivity] = useState<LoginActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchData = async () => {
    // Fetch profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    // Fetch roles
    const { data: roles } = await supabase
      .from('user_roles')
      .select('*');

    // Merge profiles with roles
    const usersWithRoles = profiles?.map(profile => ({
      ...profile,
      role: roles?.find(r => r.user_id === profile.user_id)?.role || 'user',
    })) || [];

    setUsers(usersWithRoles);

    // Fetch login activity
    const { data: activity } = await supabase
      .from('user_login_activity')
      .select('*')
      .order('login_at', { ascending: false })
      .limit(50);

    setLoginActivity(activity || []);
    setIsLoading(false);
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'moderator' | 'user') => {
    const { error } = await supabase
      .from('user_roles')
      .upsert({ user_id: userId, role: newRole }, { onConflict: 'user_id' });

    if (error) {
      toast.error('Failed to update role');
    } else {
      toast.success('Role updated');
      fetchData();
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="User Management" subtitle="Manage users and roles">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="User Management" subtitle={`${users.length} registered users`}>
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="users">
            <UserCheck className="h-4 w-4 mr-1" />
            Users
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Clock className="h-4 w-4 mr-1" />
            Login Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((u) => (
              <Card key={u.id} variant="elevated">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{u.full_name || 'No name'}</p>
                      <p className="text-sm text-muted-foreground">{u.phone || 'No phone'}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Joined {format(new Date(u.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                      {u.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                      {u.role}
                    </Badge>
                  </div>
                  {u.user_id !== currentUserId && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant={u.role === 'admin' ? 'default' : 'outline'}
                        className="flex-1 text-xs"
                        onClick={() => updateUserRole(u.user_id, 'admin')}
                      >
                        Admin
                      </Button>
                      <Button
                        size="sm"
                        variant={u.role === 'user' ? 'default' : 'outline'}
                        className="flex-1 text-xs"
                        onClick={() => updateUserRole(u.user_id, 'user')}
                      >
                        User
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-3">
          {loginActivity.length === 0 ? (
            <Card variant="elevated">
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No login activity recorded yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loginActivity.map((activity) => {
                const userProfile = users.find(u => u.user_id === activity.user_id);
                return (
                  <Card key={activity.id} variant="elevated">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {userProfile?.full_name || 'Unknown User'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {activity.ip_address || 'Unknown IP'}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {activity.login_at 
                            ? format(new Date(activity.login_at), 'MMM d, h:mm a')
                            : 'Unknown time'}
                        </span>
                      </div>
                      {activity.user_agent && (
                        <p className="text-xs text-muted-foreground mt-2 truncate">
                          {activity.user_agent}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminUsers;
