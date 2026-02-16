import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BottomNav } from '@/components/BottomNav';
import { AuthGuard } from '@/components/AuthGuard';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, FileText, Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { PhotoUpload } from '@/components/PhotoUpload';
import { BarangaySelect } from '@/components/BarangaySelect';
import { z } from 'zod';

// Municipal document/service categories (online request, pick up at municipal hall)
const categories = [
  { value: 'barangay_clearance', label: 'Barangay Clearance', description: 'For employment, business, etc.' },
  { value: 'business_permit', label: 'Business Permit', description: 'New or renewal of business permit' },
  { value: 'mayors_permit', label: "Mayor's Permit", description: 'For business operations' },
  { value: 'community_tax', label: 'Community Tax Certificate (Cedula)', description: 'Individual or corporate' },
  { value: 'birth_certificate', label: 'Birth Certificate', description: 'Copy of birth certificate' },
  { value: 'death_certificate', label: 'Death Certificate', description: 'Copy of death certificate' },
  { value: 'marriage_certificate', label: 'Marriage Certificate', description: 'Copy of marriage certificate' },
  { value: 'residency_certificate', label: 'Certificate of Residency', description: 'Proof of residence' },
  { value: 'indigency_certificate', label: 'Certificate of Indigency', description: 'For financial assistance' },
  { value: 'good_moral', label: 'Good Moral Certificate', description: 'Character reference' },
  { value: 'philhealth', label: 'PhilHealth Assistance', description: 'Health insurance assistance' },
  { value: '4ps', label: '4Ps Enrollment/Assistance', description: 'Pantawid Pamilyang Pilipino Program' },
  { value: 'senior_citizen', label: 'Senior Citizen ID', description: 'New or renewal' },
  { value: 'pwd_id', label: 'PWD ID Application', description: 'Persons with disability ID' },
  { value: 'solo_parent', label: 'Solo Parent ID', description: 'Solo parent identification' },
  { value: 'building_permit', label: 'Building Permit', description: 'Construction and renovation' },
  { value: 'zoning_clearance', label: 'Zoning Clearance', description: 'Land use certification' },
  { value: 'other', label: 'Other Services', description: 'Other municipal services' },
];

// Validation schema
const requestSchema = z.object({
  category: z.string().min(1, 'Please select a service type'),
  fullName: z.string().min(3, 'Full name must be at least 3 characters').max(100, 'Name too long'),
  contactNumber: z.string().min(10, 'Please enter a valid contact number').max(15, 'Contact number too long'),
  purpose: z.string().min(10, 'Please describe the purpose (at least 10 characters)').max(500, 'Purpose too long'),
  barangay: z.string().min(1, 'Please select your barangay'),
});

const RequestService = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  
  const { user, isLoading: authLoading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [purpose, setPurpose] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [barangay, setBarangay] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    try {
      requestSchema.parse({ category, fullName, contactNumber, purpose, barangay });
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

    if (!user) {
      toast.error('Please sign in to request municipal services');
      navigate('/auth');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    const selectedCategory = categories.find(c => c.value === category);
    
    const { error } = await supabase.from('service_requests').insert({
      user_id: user.id,
      title: `${selectedCategory?.label || category} - ${fullName}`,
      description: `Purpose: ${purpose}\n\nContact: ${contactNumber}\n\n${additionalInfo ? `Additional Info: ${additionalInfo}` : ''}`,
      category: selectedCategory?.label || category,
      location: barangay,
      photo_url: photoUrl,
    });

    if (error) {
      toast.error('Failed to submit request');
    } else {
      setIsSuccess(true);
      toast.success('Request submitted successfully!');
    }

    setIsSubmitting(false);
  };

  const selectedCategoryInfo = categories.find(c => c.value === category);

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="app-container">
          <div className="px-4 pt-12 flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6 animate-scale-in">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-center mb-2">Request Submitted!</h1>
            <p className="text-muted-foreground text-center mb-4">
              Your request has been submitted successfully.
            </p>
            <Card variant="elevated" className="w-full mb-6">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-primary mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">What's next?</p>
                    <ol className="text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Wait for SMS/notification when your document is ready</li>
                      <li>Proceed to Municipal Hall to pick up</li>
                      <li>Bring valid ID and payment (if applicable)</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/')}>
                Go Home
              </Button>
              <Button onClick={() => navigate('/my-requests')}>
                View My Requests
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
        <div className="hero-gradient px-4 pt-12 pb-8">
          <button
            onClick={() => navigate('/services')}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-white text-xl font-bold">Request Document/Service</h1>
              <p className="text-white/70 text-sm">Online request, pick up at Municipal Hall</p>
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
                  {/* Service Type */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Service/Document Type *</label>
                    <Select value={category} onValueChange={(v) => { setCategory(v); setErrors(prev => ({ ...prev, category: '' })); }}>
                      <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            <div>
                              <span>{cat.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedCategoryInfo && (
                      <p className="text-xs text-muted-foreground">{selectedCategoryInfo.description}</p>
                    )}
                    {errors.category && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.category}
                      </p>
                    )}
                  </div>

                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name (as it will appear on document) *</label>
                    <Input
                      value={fullName}
                      onChange={(e) => { setFullName(e.target.value); setErrors(prev => ({ ...prev, fullName: '' })); }}
                      placeholder="Juan Dela Cruz"
                      maxLength={100}
                      className={errors.fullName ? 'border-destructive' : ''}
                    />
                    {errors.fullName && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.fullName}
                      </p>
                    )}
                  </div>

                  {/* Contact Number */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Contact Number *</label>
                    <Input
                      type="tel"
                      value={contactNumber}
                      onChange={(e) => { setContactNumber(e.target.value); setErrors(prev => ({ ...prev, contactNumber: '' })); }}
                      placeholder="09XX XXX XXXX"
                      maxLength={15}
                      className={errors.contactNumber ? 'border-destructive' : ''}
                    />
                    {errors.contactNumber && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.contactNumber}
                      </p>
                    )}
                  </div>

                  {/* Barangay */}
                  <BarangaySelect
                    value={barangay}
                    onValueChange={(v) => { setBarangay(v); setErrors(prev => ({ ...prev, barangay: '' })); }}
                    error={errors.barangay}
                  />

                  {/* Purpose */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Purpose *</label>
                    <Textarea
                      value={purpose}
                      onChange={(e) => { setPurpose(e.target.value); setErrors(prev => ({ ...prev, purpose: '' })); }}
                      placeholder="e.g., For employment application, for business registration..."
                      rows={2}
                      maxLength={500}
                      className={errors.purpose ? 'border-destructive' : ''}
                    />
                    {errors.purpose && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.purpose}
                      </p>
                    )}
                  </div>

                  {/* Additional Info */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Additional Information (Optional)</label>
                    <Textarea
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                      placeholder="Any other details or special requests..."
                      rows={2}
                      maxLength={500}
                    />
                  </div>

                  {/* Photo Upload */}
                  <PhotoUpload
                    label="Supporting Document/ID (Optional)"
                    onUpload={setPhotoUrl}
                    currentUrl={photoUrl}
                    onRemove={() => setPhotoUrl(null)}
                  />

                  <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Submit Request'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </AuthGuard>
        </div>
      </div>

      <BottomNav currentPath="/services" />
    </div>
  );
};

export default RequestService;
