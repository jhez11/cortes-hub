import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BottomNav } from '@/components/BottomNav';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, AlertTriangle, Loader2, CheckCircle, AlertCircle, MapPin } from 'lucide-react';
import { PhotoUpload } from '@/components/PhotoUpload';
import { BarangaySelect } from '@/components/BarangaySelect';
import { z } from 'zod';

// Report categories
const reportCategories = [
  { value: 'road_damage', label: 'Road Damage', description: 'Potholes, cracks, flooding' },
  { value: 'street_light', label: 'Street Light Issue', description: 'Broken or not working' },
  { value: 'garbage', label: 'Garbage/Waste Problem', description: 'Uncollected garbage, illegal dumping' },
  { value: 'drainage', label: 'Drainage/Canal Issue', description: 'Clogged or damaged drainage' },
  { value: 'water_supply', label: 'Water Supply Problem', description: 'No water, low pressure, leaks' },
  { value: 'public_safety', label: 'Public Safety Concern', description: 'Hazards, security issues' },
  { value: 'noise', label: 'Noise Complaint', description: 'Excessive noise disturbance' },
  { value: 'stray_animals', label: 'Stray Animals', description: 'Stray dogs, cats, livestock' },
  { value: 'illegal_activity', label: 'Illegal Activity', description: 'Report suspicious activities' },
  { value: 'environmental', label: 'Environmental Issue', description: 'Pollution, tree cutting' },
  { value: 'other', label: 'Other Issue', description: 'Other community concerns' },
];

// Validation schema - less strict since reports can be anonymous
const reportSchema = z.object({
  category: z.string().min(1, 'Please select a category'),
  description: z.string().min(20, 'Please provide more details (at least 20 characters)').max(1000, 'Description too long'),
  barangay: z.string().min(1, 'Please select the barangay'),
});

const ReportIssue = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [barangay, setBarangay] = useState('');
  const [locationDetails, setLocationDetails] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    try {
      reportSchema.parse({ category, description, barangay });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    const selectedCategory = reportCategories.find(c => c.value === category);
    
    // Get current user if logged in, otherwise submit as anonymous
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from('service_requests').insert({
      user_id: user?.id || null,
      title: `[REPORT] ${selectedCategory?.label || category}`,
      description: `${description}\n\n${contactName ? `Reporter: ${contactName}` : 'Anonymous Report'}\n${contactNumber ? `Contact: ${contactNumber}` : ''}\n${locationDetails ? `Location Details: ${locationDetails}` : ''}`,
      category: `Report: ${selectedCategory?.label || category}`,
      location: barangay + (locationDetails ? `, ${locationDetails}` : ''),
      photo_url: photoUrl,
    });

    if (error) {
      console.error('Report submission error:', error);
      toast.error('Failed to submit report');
    } else {
      setIsSuccess(true);
      toast.success('Report submitted successfully!');
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
            <h1 className="text-2xl font-bold text-center mb-2">Report Submitted!</h1>
            <p className="text-muted-foreground text-center mb-8">
              Thank you for your report. The municipal office will review and take action.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/')}>
                Go Home
              </Button>
              <Button onClick={() => {
                setIsSuccess(false);
                setCategory('');
                setDescription('');
                setBarangay('');
                setLocationDetails('');
                setContactName('');
                setContactNumber('');
                setPhotoUrl(null);
              }}>
                Submit Another Report
              </Button>
            </div>
          </div>
        </div>
        <BottomNav currentPath="/services" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="app-container">
        {/* Header */}
        <div className="bg-gradient-to-b from-accent to-accent/80 px-4 pt-12 pb-8">
          <button
            onClick={() => navigate('/services')}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-white text-xl font-bold">Report an Issue</h1>
              <p className="text-white/70 text-sm">No login required • Help improve our community</p>
            </div>
          </div>
        </div>

        {/* Curved transition */}
        <div className="h-6 bg-background rounded-t-3xl -mt-6 relative z-10" />

        {/* Form - No Auth Required */}
        <div className="px-4 -mt-2">
          <Card variant="elevated" className="animate-slide-up">
            <CardContent className="p-5">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Issue Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type of Issue *</label>
                  <Select value={category} onValueChange={(v) => { setCategory(v); setErrors(prev => ({ ...prev, category: '' })); }}>
                    <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                      <SelectValue placeholder="What are you reporting?" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.category}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Describe the Issue *</label>
                  <Textarea
                    value={description}
                    onChange={(e) => { setDescription(e.target.value); setErrors(prev => ({ ...prev, description: '' })); }}
                    placeholder="Please describe the issue in detail. What did you observe? When did it happen?"
                    rows={4}
                    maxLength={1000}
                    className={errors.description ? 'border-destructive' : ''}
                  />
                  <p className="text-xs text-muted-foreground text-right">{description.length}/1000</p>
                  {errors.description && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.description}
                    </p>
                  )}
                </div>

                {/* Barangay */}
                <BarangaySelect
                  value={barangay}
                  onValueChange={(v) => { setBarangay(v); setErrors(prev => ({ ...prev, barangay: '' })); }}
                  error={errors.barangay}
                />

                {/* Location Details */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Specific Location (Optional)
                  </label>
                  <Input
                    value={locationDetails}
                    onChange={(e) => setLocationDetails(e.target.value)}
                    placeholder="e.g., Near the school, in front of the church..."
                    maxLength={200}
                  />
                </div>

                {/* Photo Upload */}
                <PhotoUpload
                  label="Photo Evidence (Recommended)"
                  onUpload={setPhotoUrl}
                  currentUrl={photoUrl}
                  onRemove={() => setPhotoUrl(null)}
                />

                {/* Contact Info (Optional) */}
                <div className="p-4 rounded-xl bg-muted/50 space-y-3">
                  <p className="text-sm font-medium">Contact Information (Optional)</p>
                  <p className="text-xs text-muted-foreground">
                    Provide your contact details if you want updates on this report. Otherwise, submit anonymously.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Your name"
                      maxLength={100}
                    />
                    <Input
                      type="tel"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="Contact number"
                      maxLength={15}
                    />
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Submit Report'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNav currentPath="/services" />
    </div>
  );
};

export default ReportIssue;
