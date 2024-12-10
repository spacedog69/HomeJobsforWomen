import { useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, CreditCard, Settings } from "lucide-react";
import { handleSubscribe } from "@/components/signup/utils/subscriptionHandler";
import { format } from "date-fns";

interface ProfileFormProps {
  profile: any;
  type: 'personal' | 'billing' | 'preferences';
}

export function ProfileForm({ profile, type }: ProfileFormProps) {
  const session = useSession();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    username: profile?.username || '',
    website: profile?.website || '',
    billing_address: profile?.billing_address || '',
    phone_number: profile?.phone_number || '',
    company_name: profile?.company_name || '',
  });

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription-details'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const response = await fetch('/api/get-subscription-details', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch subscription details');
      return response.json();
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', session?.user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const renderPersonalInfo = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <User className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Personal Information</h2>
      </div>
      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name</Label>
        <Input
          id="full_name"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          className="bg-[#1A1F2C]"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="username">Email</Label>
        <Input
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          className="bg-[#1A1F2C]"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="website">LinkedIn Profile</Label>
        <Input
          id="website"
          name="website"
          value={formData.website}
          onChange={handleChange}
          placeholder="https://linkedin.com/in/username"
          className="bg-[#1A1F2C]"
        />
      </div>
    </div>
  );

  const renderBillingInfo = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <CreditCard className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Billing Information</h2>
      </div>
      
      {subscriptionData?.subscription ? (
        <div className="bg-[#1A1F2C] p-4 rounded-lg mb-6">
          <h3 className="text-lg font-medium mb-2">Current Subscription</h3>
          <p className="text-muted-foreground">Plan: {subscriptionData.subscription.name}</p>
          <p className="text-muted-foreground">
            Started: {format(new Date(subscriptionData.subscription.current_period_start * 1000), 'PPP')}
          </p>
          <p className="text-muted-foreground">
            Expires: {format(new Date(subscriptionData.subscription.current_period_end * 1000), 'PPP')}
          </p>
          <Button 
            onClick={() => handleSubscribe('price_copper_weekly')} 
            className="mt-4"
          >
            Extend Subscription
          </Button>
        </div>
      ) : (
        <p className="text-muted-foreground mb-6">No active subscription found.</p>
      )}

      <div className="space-y-2">
        <Label htmlFor="billing_address">Billing Address</Label>
        <Input
          id="billing_address"
          name="billing_address"
          value={formData.billing_address}
          onChange={handleChange}
          className="bg-[#1A1F2C]"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone_number">Phone Number</Label>
        <Input
          id="phone_number"
          name="phone_number"
          value={formData.phone_number}
          onChange={handleChange}
          className="bg-[#1A1F2C]"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="company_name">Company Name</Label>
        <Input
          id="company_name"
          name="company_name"
          value={formData.company_name}
          onChange={handleChange}
          className="bg-[#1A1F2C]"
        />
      </div>
    </div>
  );

  const renderPreferences = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Preferences</h2>
      </div>
      <p className="text-muted-foreground">
        Job preferences can be updated from the main jobs page filters.
      </p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="p-6">
      {type === 'personal' && renderPersonalInfo()}
      {type === 'billing' && renderBillingInfo()}
      {type === 'preferences' && renderPreferences()}
      
      <Button 
        type="submit"
        className="mt-6 bg-primary hover:bg-primary/90"
        disabled={updateProfile.isPending}
      >
        {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  );
}