import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// We'll create a simple avatar component inline since it doesn't exist
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  Settings,
  Edit,
  Key,
  Bell,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { PasswordChangeCard } from "@/components/profile/password-change-card";

async function getUserProfile() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  const locale = await getLocale();

  if (error || !user) {
    redirect(`/${locale}/login`);
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    redirect(`/${locale}/login`);
  }

  return {
    user,
    profile,
    locale
  };
}

export default async function ProfilePage() {
  const { user, profile, locale } = await getUserProfile();

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "manager":
        return "bg-blue-100 text-blue-800";
      case "field_agent":
        return "bg-green-100 text-green-800";
      case "procurement_officer":
        return "bg-purple-100 text-purple-800";
      case "warehouse_manager":
        return "bg-orange-100 text-orange-800";
      case "transport_driver":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  // Simple Avatar component
  const Avatar = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={`rounded-full bg-gray-200 flex items-center justify-center ${className}`}>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/${locale}/dashboard`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
                <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
              </div>
            </div>
            <Button asChild>
              <Link href={`/${locale}/profile/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Overview */}
          <div className="md:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Avatar className="h-24 w-24 mx-auto mb-4">
                    <span className="text-lg font-semibold text-gray-600">
                      {getInitials(profile.name, profile.email)}
                    </span>
                  </Avatar>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {profile.name || "No name set"}
                  </h2>
                  <Badge className={getRoleColor(profile.role)}>
                    {profile.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                  <p className="text-gray-600 mt-2 text-sm">{profile.email}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Your account details and personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                    <p className="mt-1 text-gray-900">{profile.name || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email Address</label>
                    <p className="mt-1 text-gray-900">{profile.email}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Role</label>
                    <div className="mt-1">
                      <Badge className={getRoleColor(profile.role)}>
                        {profile.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Account Information
                </CardTitle>
                <CardDescription>
                  Account status and registration details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Account Created</label>
                    <p className="mt-1 text-gray-900">
                      {new Date(profile.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Last Updated</label>
                    <p className="mt-1 text-gray-900">
                      {new Date(profile.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email Status</label>
                    <div className="mt-1">
                      <Badge variant={user.email_confirmed_at ? "default" : "secondary"}>
                        {user.email_confirmed_at ? "Verified" : "Unverified"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Last Sign In</label>
                    <p className="mt-1 text-gray-900">
                      {user.last_sign_in_at 
                        ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : "Never"
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Contact Information
                </CardTitle>
                <CardDescription>
                  How to reach you and communication preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Primary Email</label>
                  <p className="mt-1 text-gray-900">{profile.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone Number</label>
                  <p className="mt-1 text-gray-500">{profile.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Department</label>
                  <p className="mt-1 text-gray-900">
                    {profile.role === 'field_agent' && 'Field Operations'}
                    {profile.role === 'admin' && 'Administration'}
                    {profile.role === 'manager' && 'Management'}
                    {profile.role === 'procurement_officer' && 'Procurement'}
                    {profile.role === 'warehouse_manager' && 'Warehouse Management'}
                    {profile.role === 'transport_driver' && 'Transportation'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Password Change */}
            <PasswordChangeCard userId={user.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
