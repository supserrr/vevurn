'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Upload, Building, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

const onboardingSchema = z.object({
  businessName: z.string().min(2, 'Business name is required'),
  tin: z.string().optional(),
  logo: z.any().optional(),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      businessName: '',
      tin: ''
    }
  });

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      form.setValue('logo', file);
    }
  };

  const onSubmit = async (data: OnboardingFormData) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('businessName', data.businessName);
      if (data.tin) formData.append('tin', data.tin);
      if (data.logo) formData.append('logo', data.logo);

      const response = await fetch('/api/business/setup', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Business setup completed successfully!');
        router.push('/dashboard');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Setup failed');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Building className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <CardTitle className="text-2xl font-bold">Welcome to Vevurn POS</CardTitle>
          <p className="text-gray-600">Let's set up your business</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Business Name */}
            <div>
              <Label htmlFor="businessName" className="text-sm font-medium">
                Business Name *
              </Label>
              <Input
                id="businessName"
                {...form.register('businessName')}
                placeholder="Enter your business name"
                className="mt-1"
              />
              {form.formState.errors.businessName && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.businessName.message}
                </p>
              )}
            </div>

            {/* Logo Upload */}
            <div>
              <Label className="text-sm font-medium">Business Logo (Optional)</Label>
              <div className="mt-1 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
                {logoPreview ? (
                  <div className="text-center">
                    <img 
                      src={logoPreview} 
                      alt="Logo preview" 
                      className="h-20 w-20 object-cover rounded-lg mx-auto mb-2" 
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setLogoPreview(null);
                        form.setValue('logo', undefined);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-400">PNG, JPG up to 2MB</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* TIN */}
            <div>
              <Label htmlFor="tin" className="text-sm font-medium">
                Tax ID Number (Optional)
              </Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="tin"
                  {...form.register('tin')}
                  placeholder="Enter your TIN"
                  className="pl-10 mt-1"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Setting up...' : 'Complete Setup'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
