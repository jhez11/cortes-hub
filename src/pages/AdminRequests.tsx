import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  CheckCircle, Clock, XCircle, MapPin, 
  MessageSquare, RefreshCw, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ImageAnalysis } from '@/components/ImageAnalysis';
import { AdminLayout } from '@/components/admin/AdminLayout';
import type { Tables } from '@/integrations/supabase/types';

type ServiceRequest = Tables<'service_requests'>;

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-warning text-warning-foreground', icon: Clock },
  in_progress: { label: 'Processing', color: 'bg-primary text-primary-foreground', icon: RefreshCw },
  completed: { label: 'Completed', color: 'bg-success text-success-foreground', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-destructive text-destructive-foreground', icon: XCircle },
};

const AdminRequests = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('service_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setRequests(data);
    setIsLoading(false);
  };

  const updateStatus = async (id: string, status: 'pending' | 'in_progress' | 'completed' | 'rejected', notes?: string) => {
    setIsUpdating(true);
    const updateData: any = { status };
    if (notes !== undefined) updateData.admin_notes = notes;

    const { error } = await supabase
      .from('service_requests')
      .update(updateData)
      .eq('id', id);

    if (!error) {
      toast.success('Request updated successfully');
      fetchRequests();
      setSelectedRequest(null);
      setAdminNotes('');
    } else {
      toast.error('Failed to update request');
    }
    setIsUpdating(false);
  };

  const openRequestDetails = (req: ServiceRequest) => {
    setSelectedRequest(req);
    setAdminNotes(req.admin_notes || '');
  };

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
  };

  const filteredRequests = activeTab === 'all' 
    ? requests 
    : requests.filter(r => r.status === activeTab);

  if (isLoading) {
    return (
      <AdminLayout title="Service Requests" subtitle="Manage all requests">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Service Requests" subtitle={`${stats.total} total requests`}>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-foreground' },
          { label: 'Pending', value: stats.pending, color: 'text-warning' },
          { label: 'Processing', value: stats.in_progress, color: 'text-primary' },
          { label: 'Completed', value: stats.completed, color: 'text-success' },
        ].map((stat) => (
          <Card key={stat.label} variant="elevated">
            <CardContent className="p-4 text-center">
              <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs and Requests */}
      <Card variant="elevated">
        <CardContent className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="in_progress">Processing</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {filteredRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No requests found</p>
              ) : (
                filteredRequests.map((req) => {
                  const StatusIcon = statusConfig[req.status].icon;
                  return (
                    <div 
                      key={req.id} 
                      className="p-4 border rounded-xl space-y-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => openRequestDetails(req)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">{req.category}</Badge>
                            <Badge className={cn("text-xs", statusConfig[req.status].color)}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig[req.status].label}
                            </Badge>
                          </div>
                          <p className="font-medium text-sm line-clamp-1">{req.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(req.created_at), 'MMM d, yyyy • h:mm a')}
                          </p>
                        </div>
                        {req.photo_url && (
                          <div className="w-12 h-12 rounded-lg overflow-hidden ml-3">
                            <img src={req.photo_url} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                      {req.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {req.location}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Request Details Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              {selectedRequest.photo_url && (
                <div className="space-y-2">
                  <img 
                    src={selectedRequest.photo_url} 
                    alt="Request" 
                    className="w-full h-48 object-cover rounded-xl"
                  />
                  <ImageAnalysis imageUrl={selectedRequest.photo_url} />
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="font-medium">{selectedRequest.category}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Title</p>
                  <p className="font-medium">{selectedRequest.title}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm">{selectedRequest.description}</p>
                </div>
                {selectedRequest.location && (
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-primary" />
                      {selectedRequest.location}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Current Status</p>
                  <Badge className={cn("mt-1", statusConfig[selectedRequest.status].color)}>
                    {statusConfig[selectedRequest.status].label}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Admin Remarks
                </label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes or remarks for this request..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Update Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['pending', 'in_progress', 'completed', 'rejected'] as const).map((status) => {
                    const config = statusConfig[status];
                    const StatusIcon = config.icon;
                    return (
                      <Button
                        key={status}
                        variant={selectedRequest.status === status ? 'default' : 'outline'}
                        size="sm"
                        className={selectedRequest.status === status ? config.color : ''}
                        onClick={() => updateStatus(selectedRequest.id, status, adminNotes)}
                        disabled={isUpdating}
                      >
                        <StatusIcon className="h-4 w-4 mr-1" />
                        {config.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminRequests;
