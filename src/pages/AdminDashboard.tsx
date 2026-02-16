import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { 
  ClipboardList, Users, MapPin, MessageSquare, 
  TrendingUp, Clock, CheckCircle, XCircle
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  type ChartConfig 
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

const chartConfig = {
  pending: { label: 'Pending', color: 'hsl(var(--warning))' },
  in_progress: { label: 'Processing', color: 'hsl(var(--primary))' },
  completed: { label: 'Completed', color: 'hsl(var(--success))' },
  rejected: { label: 'Rejected', color: 'hsl(var(--destructive))' },
  requests: { label: 'Requests', color: 'hsl(var(--primary))' },
  users: { label: 'Users', color: 'hsl(var(--accent))' },
} satisfies ChartConfig;

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    totalUsers: 0,
    totalSpots: 0,
    totalFeedback: 0,
  });
  const [statusData, setStatusData] = useState<{ name: string; value: number; fill: string }[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ date: string; requests: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ category: string; count: number }[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // Fetch requests
    const { data: requests } = await supabase
      .from('service_requests')
      .select('*');

    // Fetch users count
    const { count: usersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Fetch tourist spots count
    const { count: spotsCount } = await supabase
      .from('tourist_spots')
      .select('*', { count: 'exact', head: true });

    // Fetch feedback count
    const { count: feedbackCount } = await supabase
      .from('feedback')
      .select('*', { count: 'exact', head: true });

    if (requests) {
      const pending = requests.filter(r => r.status === 'pending').length;
      const inProgress = requests.filter(r => r.status === 'in_progress').length;
      const completed = requests.filter(r => r.status === 'completed').length;
      const rejected = requests.filter(r => r.status === 'rejected').length;

      setStats({
        totalRequests: requests.length,
        pendingRequests: pending,
        completedRequests: completed,
        totalUsers: usersCount || 0,
        totalSpots: spotsCount || 0,
        totalFeedback: feedbackCount || 0,
      });

      // Status pie chart data
      setStatusData([
        { name: 'Pending', value: pending, fill: 'hsl(var(--warning))' },
        { name: 'Processing', value: inProgress, fill: 'hsl(var(--primary))' },
        { name: 'Completed', value: completed, fill: 'hsl(var(--success))' },
        { name: 'Rejected', value: rejected, fill: 'hsl(var(--destructive))' },
      ].filter(d => d.value > 0));

      // Weekly data for line chart
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = startOfDay(subDays(new Date(), 6 - i));
        const count = requests.filter(r => {
          const reqDate = startOfDay(new Date(r.created_at));
          return reqDate.getTime() === date.getTime();
        }).length;
        return {
          date: format(date, 'EEE'),
          requests: count,
        };
      });
      setWeeklyData(last7Days);

      // Category breakdown
      const categories: Record<string, number> = {};
      requests.forEach(r => {
        const cat = r.category.replace('Request: ', '').replace('Report: ', '');
        categories[cat] = (categories[cat] || 0) + 1;
      });
      setCategoryData(
        Object.entries(categories)
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
      );
    }
  };

  const statCards = [
    { icon: ClipboardList, label: 'Total Requests', value: stats.totalRequests, color: 'text-primary' },
    { icon: Clock, label: 'Pending', value: stats.pendingRequests, color: 'text-warning' },
    { icon: CheckCircle, label: 'Completed', value: stats.completedRequests, color: 'text-success' },
    { icon: Users, label: 'Users', value: stats.totalUsers, color: 'text-accent' },
    { icon: MapPin, label: 'Tourist Spots', value: stats.totalSpots, color: 'text-primary' },
    { icon: MessageSquare, label: 'Feedback', value: stats.totalFeedback, color: 'text-muted-foreground' },
  ];

  return (
    <AdminLayout title="Dashboard" subtitle="Overview of system statistics">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {statCards.map((stat) => (
          <Card key={stat.label} variant="elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Weekly Requests Line Chart */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5" />
              Weekly Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px]">
              <LineChart data={weeklyData}>
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="requests" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Status Pie Chart */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-5 w-5" />
              Request Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px]">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-5 w-5" />
            Top Request Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <BarChart data={categoryData} layout="vertical">
              <XAxis type="number" tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="category" tickLine={false} axisLine={false} width={120} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminDashboard;
