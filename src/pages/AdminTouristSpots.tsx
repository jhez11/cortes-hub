import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Save, X, Loader2, Image as ImageIcon, Upload } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import type { Tables } from '@/integrations/supabase/types';

type TouristSpot = Tables<'tourist_spots'>;

const MUNICIPALITIES = [
  'Cortes',
  'Barobo',
  'Bislig City',
  'Cagwait',
  'Cantilan',
  'Carmen',
  'Carrascal',
  'Hinatuan',
  'Lanuza',
  'Lianga',
  'Lingig',
  'Madrid',
  'Marihatag',
  'San Agustin',
  'San Miguel',
  'Tagbina',
  'Tago',
  'Tandag City',
];

const AdminTouristSpots = () => {
  const [spots, setSpots] = useState<TouristSpot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSpot, setEditingSpot] = useState<Partial<TouristSpot> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchSpots();
  }, []);

  const fetchSpots = async () => {
    const { data } = await supabase
      .from('tourist_spots')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setSpots(data);
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!editingSpot?.title || !editingSpot?.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (isCreating) {
      const { error } = await supabase.from('tourist_spots').insert({
        title: editingSpot.title,
        description: editingSpot.description,
        municipality: editingSpot.municipality || null,
        location: editingSpot.location || null,
        images: editingSpot.images || [],
        is_active: editingSpot.is_active ?? true,
        created_by: user?.id,
      });

      if (error) {
        toast.error('Failed to create tourist spot');
      } else {
        toast.success('Tourist spot created');
        setEditingSpot(null);
        setIsCreating(false);
        fetchSpots();
      }
    } else {
      const { error } = await supabase
        .from('tourist_spots')
        .update({
          title: editingSpot.title,
          description: editingSpot.description,
          municipality: editingSpot.municipality,
          location: editingSpot.location,
          images: editingSpot.images,
          is_active: editingSpot.is_active,
        })
        .eq('id', editingSpot.id!);

      if (error) {
        toast.error('Failed to update tourist spot');
      } else {
        toast.success('Tourist spot updated');
        setEditingSpot(null);
        fetchSpots();
      }
    }

    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tourist spot?')) return;

    const { error } = await supabase.from('tourist_spots').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete tourist spot');
    } else {
      toast.success('Tourist spot deleted');
      fetchSpots();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    for (const file of Array.from(files)) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        continue;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        continue;
      }

      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `tourist-spots/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('uploads')
          .getPublicUrl(filePath);

        setEditingSpot(prev => ({
          ...prev,
          images: [...(prev?.images || []), publicUrl],
        }));

        toast.success(`${file.name} uploaded`);
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setIsUploading(false);
    // Reset input
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setEditingSpot(prev => ({
      ...prev,
      images: prev?.images?.filter((_, i) => i !== index) || [],
    }));
  };

  if (isLoading) {
    return (
      <AdminLayout title="Tourist Spots" subtitle="Manage destinations">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Tourist Spots" subtitle={`${spots.length} destinations`}>
      {/* Add Button */}
      <div className="mb-6">
        <Button
          onClick={() => {
            setEditingSpot({ is_active: true, images: [] });
            setIsCreating(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Tourist Spot
        </Button>
      </div>

      {/* Edit/Create Form */}
      {editingSpot && (
        <Card variant="elevated" className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              {isCreating ? 'Add Tourist Spot' : 'Edit Tourist Spot'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={editingSpot.title || ''}
                  onChange={(e) => setEditingSpot(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Tourist spot name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Municipality</label>
                <select
                  value={editingSpot.municipality || ''}
                  onChange={(e) => setEditingSpot(prev => ({ ...prev, municipality: e.target.value }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select municipality</option>
                  {MUNICIPALITIES.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Location Details</label>
              <Input
                value={editingSpot.location || ''}
                onChange={(e) => setEditingSpot(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Barangay Name, near landmark"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description *</label>
              <Textarea
                value={editingSpot.description || ''}
                onChange={(e) => setEditingSpot(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this tourist spot..."
                rows={4}
              />
            </div>

            {/* Photo Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Photos</label>
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="photo-upload"
                  disabled={isUploading}
                />
                <label 
                  htmlFor="photo-upload" 
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  {isUploading ? (
                    <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                  ) : (
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {isUploading ? 'Uploading...' : 'Click to upload photos from gallery or files'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Supports: JPG, PNG, GIF (max 5MB each)
                  </span>
                </label>
              </div>
            </div>

            {/* Image Preview Grid */}
            {editingSpot.images && editingSpot.images.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {editingSpot.images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img 
                      src={img} 
                      alt="" 
                      className="w-full h-24 object-cover rounded-lg border border-border" 
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingSpot.is_active ?? true}
                  onCheckedChange={(checked) => setEditingSpot(prev => ({ ...prev, is_active: checked }))}
                />
                <span className="text-sm">Active (visible to users)</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setEditingSpot(null);
                  setIsCreating(false);
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {spots.map((spot) => (
          <Card key={spot.id} variant="elevated" className="overflow-hidden">
            <div className="h-40">
              {spot.images && spot.images.length > 0 ? (
                <img src={spot.images[0]} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium">{spot.title}</h3>
                  <p className="text-sm text-muted-foreground">{spot.municipality}</p>
                </div>
                <span className={`text-xs ${spot.is_active ? 'text-success' : 'text-muted-foreground'}`}>
                  {spot.is_active ? '● Active' : '○ Hidden'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {spot.description}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setEditingSpot(spot);
                    setIsCreating(false);
                  }}
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleDelete(spot.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminTouristSpots;
