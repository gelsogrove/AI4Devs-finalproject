import { toast } from '@/components/ui/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Briefcase, Building, Clock, Globe, Mail, MapPin, Phone, Save, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { profileApi } from '../api/profileApi';
import { Profile, UpdateProfileDto } from '../types/profile';

// Validation schema
const profileSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  logoUrl: z.string().url('Logo URL must be a valid URL').optional().or(z.literal('')),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 characters'),
  website: z.string().url('Website must be a valid URL').optional().or(z.literal('')),
  email: z.string().email('Email must be a valid email address'),
  openingTime: z.string().min(5, 'Opening time must be at least 5 characters'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  sector: z.string().min(2, 'Sector must be at least 2 characters'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema)
  });

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const profileData = await profileApi.getProfile();
        setProfile(profileData);
        
        // Reset form with profile data
        reset({
          companyName: profileData.companyName,
          logoUrl: profileData.logoUrl || '',
          description: profileData.description,
          phoneNumber: profileData.phoneNumber,
          website: profileData.website || '',
          email: profileData.email,
          openingTime: profileData.openingTime,
          address: profileData.address,
          sector: profileData.sector,
        });
      } catch (err) {
        setError('Failed to load profile');
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [reset]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!profile) return;

    try {
      setSaving(true);
      setError(null);

      const updateData: UpdateProfileDto = {
        companyName: data.companyName,
        logoUrl: data.logoUrl || undefined,
        description: data.description,
        phoneNumber: data.phoneNumber,
        website: data.website || undefined,
        email: data.email,
        openingTime: data.openingTime,
        address: data.address,
        sector: data.sector,
      };

      const response = await profileApi.updateProfile(profile.id, updateData);
      setProfile(response.profile);
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      
      // Reset form dirty state
      reset(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
      toast({
        title: "Error",
        description: err.response?.data?.error || 'Failed to update profile',
        variant: "destructive",
      });
      console.error('Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-shopme-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-shopme-50 to-green-50 rounded-xl p-6 border border-shopme-100 animate-slide-up">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Company Profile</h1>
            <p className="text-gray-600">Manage your company information and settings</p>
          </div>
        </div>
      </div>

      <div className="animate-scale-in">
        <div className="bg-white border-0 shadow-md hover:shadow-xl transition-all duration-300 rounded-xl">
          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-slide-up">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-1 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Username (Read-only) */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <User className="w-4 h-4 text-gray-400" />
                    Username
                  </label>
                  <input
                    type="text"
                    value={profile?.username || ''}
                    disabled
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed transition-colors"
                  />
                  <p className="text-xs text-gray-500">Username cannot be changed</p>
                </div>

                {/* Company Name */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Building className="w-4 h-4 text-gray-400" />
                    Company Name *
                  </label>
                  <input
                    type="text"
                    {...register('companyName')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-shopme-500 focus:border-shopme-500 transition-colors"
                  />
                  {errors.companyName && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.companyName.message}
                    </p>
                  )}
                </div>

                {/* Logo URL */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Globe className="w-4 h-4 text-gray-400" />
                    Logo URL
                  </label>
                  <input
                    type="url"
                    {...register('logoUrl')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-shopme-500 focus:border-shopme-500 transition-colors"
                    placeholder="https://example.com/logo.png"
                  />
                  {errors.logoUrl && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.logoUrl.message}
                    </p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Phone className="w-4 h-4 text-gray-400" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    {...register('phoneNumber')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-shopme-500 focus:border-shopme-500 transition-colors"
                    placeholder="+39 06 1234 5678"
                  />
                  {errors.phoneNumber && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.phoneNumber.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">Used for WhatsApp configuration</p>
                </div>

                {/* Website */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Globe className="w-4 h-4 text-gray-400" />
                    Website
                  </label>
                  <input
                    type="url"
                    {...register('website')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-shopme-500 focus:border-shopme-500 transition-colors"
                    placeholder="https://www.example.com"
                  />
                  {errors.website && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.website.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Email */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Mail className="w-4 h-4 text-gray-400" />
                    Email *
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-shopme-500 focus:border-shopme-500 transition-colors"
                    placeholder="info@example.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Opening Time */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Clock className="w-4 h-4 text-gray-400" />
                    Opening Hours *
                  </label>
                  <input
                    type="text"
                    {...register('openingTime')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-shopme-500 focus:border-shopme-500 transition-colors"
                    placeholder="Monday-Friday: 9:00-18:00"
                  />
                  {errors.openingTime && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.openingTime.message}
                    </p>
                  )}
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    Address *
                  </label>
                  <textarea
                    {...register('address')}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-shopme-500 focus:border-shopme-500 transition-colors resize-none"
                    placeholder="Via Roma 123, 00186 Roma, Italy"
                  />
                  {errors.address && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.address.message}
                    </p>
                  )}
                </div>

                {/* Sector */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    Business Sector *
                  </label>
                  <input
                    type="text"
                    {...register('sector')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-shopme-500 focus:border-shopme-500 transition-colors"
                    placeholder="Italian Food E-commerce"
                  />
                  {errors.sector && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.sector.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Description - Full Width */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Building className="w-4 h-4 text-gray-400" />
                Description *
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-shopme-500 focus:border-shopme-500 transition-colors resize-none"
                placeholder="Describe your company..."
              />
              {errors.description && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-100">
              <button
                type="submit"
                disabled={saving || !isDirty}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  saving || !isDirty
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-shopme-500 to-shopme-600 hover:from-shopme-600 hover:to-shopme-700 text-white shadow-md hover:shadow-lg'
                }`}
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 