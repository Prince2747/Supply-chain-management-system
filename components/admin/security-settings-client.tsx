"use client";

import { useState, useTransition, useMemo } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Shield, Clock, Lock, AlertTriangle, Key } from "lucide-react";

interface SecuritySettings {
  id: string;
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  passwordExpiryDays: number;
  createdAt: string;
  updatedAt: string;
}

interface SecuritySettingsClientProps {
  initialSettings: SecuritySettings | null;
}

export function SecuritySettingsClient({ initialSettings }: SecuritySettingsClientProps) {
  const [settings, setSettings] = useState({
    sessionTimeoutMinutes: initialSettings?.sessionTimeoutMinutes || 30,
    maxLoginAttempts: initialSettings?.maxLoginAttempts || 5,
    lockoutDurationMinutes: initialSettings?.lockoutDurationMinutes || 15,
    passwordExpiryDays: initialSettings?.passwordExpiryDays || 90,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isPending, startTransition] = useTransition();
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Password strength validation
  const passwordStrength = useMemo(() => {
    const password = passwordForm.newPassword;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
    };

    const score = Object.values(checks).filter(Boolean).length;
    return { checks, score };
  }, [passwordForm.newPassword]);

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 1) return "text-red-500";
    if (passwordStrength.score <= 2) return "text-orange-500";
    if (passwordStrength.score <= 3) return "text-yellow-500";
    return "text-green-500";
  };

  const getPasswordStrengthBg = () => {
    if (passwordStrength.score <= 1) return "bg-red-100 border-red-200";
    if (passwordStrength.score <= 2) return "bg-orange-100 border-orange-200";
    if (passwordStrength.score <= 3) return "bg-yellow-100 border-yellow-200";
    return "bg-green-100 border-green-200";
  };

  const handleSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    startTransition(async () => {
      try {
        const response = await fetch('/api/admin/security-settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(settings),
        });

        const result = await response.json();

        if (!response.ok) {
          toast.error(result.error || 'Failed to update security settings');
          return;
        }

        toast.success('Security settings updated successfully');
      } catch (error) {
        console.error('Error updating security settings:', error);
        toast.error('Failed to update security settings');
      }
    });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordStrength.score < 4) {
      toast.error('Password must meet all security requirements');
      return;
    }

    setIsChangingPassword(true);
    
    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordForm),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Failed to change password');
        return;
      }

      toast.success('Password changed successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleInputChange = (field: keyof typeof settings, value: number) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-green-600" />
            <CardTitle>Security Configuration</CardTitle>
          </div>
          <CardDescription>
            Configure system security settings and policies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSettingsUpdate} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Session Management */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-medium">Session Management</h3>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="5"
                    max="480"
                    value={settings.sessionTimeoutMinutes}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('sessionTimeoutMinutes', parseInt(e.target.value) || 30)}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Users will be automatically logged out after this period of inactivity (5-480 minutes)
                  </p>
                </div>
              </div>

              {/* Login Security */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Lock className="h-4 w-4 text-red-600" />
                  <h3 className="text-sm font-medium">Login Security</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxAttempts">Max Login Attempts</Label>
                    <Input
                      id="maxAttempts"
                      type="number"
                      min="1"
                      max="20"
                      value={settings.maxLoginAttempts}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('maxLoginAttempts', parseInt(e.target.value) || 5)}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Account will be locked after this many failed attempts (1-20)
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lockoutDuration">Lockout Duration (minutes)</Label>
                    <Input
                      id="lockoutDuration"
                      type="number"
                      min="1"
                      max="1440"
                      value={settings.lockoutDurationMinutes}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('lockoutDurationMinutes', parseInt(e.target.value) || 15)}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      How long accounts remain locked (1-1440 minutes)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Password Policy */}
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <h3 className="text-sm font-medium">Password Policy</h3>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                <Input
                  id="passwordExpiry"
                  type="number"
                  min="1"
                  max="365"
                  value={settings.passwordExpiryDays}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('passwordExpiryDays', parseInt(e.target.value) || 90)}
                  className="w-full max-w-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Users must change passwords after this many days (1-365)
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {isPending ? 'Updating...' : 'Update Security Settings'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Admin Password Change */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Key className="h-5 w-5 text-green-600" />
            <CardTitle>Change Admin Password</CardTitle>
          </div>
          <CardDescription>
            Update your admin account password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordForm({ 
                  ...passwordForm, 
                  currentPassword: e.target.value 
                })}
                required
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordForm({ 
                  ...passwordForm, 
                  newPassword: e.target.value 
                })}
                required
                minLength={8}
                className={`w-full transition-colors ${
                  passwordForm.newPassword ? getPasswordStrengthBg() : ''
                }`}
              />
              
              {passwordForm.newPassword && (
                <div className="space-y-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium">Password Strength:</span>
                    <Badge 
                      variant="outline" 
                      className={getPasswordStrengthColor()}
                    >
                      {passwordStrength.score <= 1 && 'Weak'}
                      {passwordStrength.score === 2 && 'Fair'}
                      {passwordStrength.score === 3 && 'Good'}
                      {passwordStrength.score === 4 && 'Strong'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <span className={passwordStrength.checks.length ? 'text-green-600' : 'text-gray-400'}>
                      ✓ At least 8 characters
                    </span>
                    <span className={passwordStrength.checks.uppercase ? 'text-green-600' : 'text-gray-400'}>
                      ✓ Uppercase letter
                    </span>
                    <span className={passwordStrength.checks.lowercase ? 'text-green-600' : 'text-gray-400'}>
                      ✓ Lowercase letter
                    </span>
                    <span className={passwordStrength.checks.number ? 'text-green-600' : 'text-gray-400'}>
                      ✓ Number
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordForm({ 
                  ...passwordForm, 
                  confirmPassword: e.target.value 
                })}
                required
                minLength={8}
                className={`w-full ${
                  passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword
                    ? 'border-red-300 bg-red-50'
                    : passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword
                    ? 'border-green-300 bg-green-50'
                    : ''
                }`}
              />
              {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                <p className="text-xs text-red-600">Passwords do not match</p>
              )}
            </div>

            <Button 
              type="submit" 
              disabled={isChangingPassword || passwordStrength.score < 4 || passwordForm.newPassword !== passwordForm.confirmPassword}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isChangingPassword ? 'Changing Password...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}