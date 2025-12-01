"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key } from "lucide-react";
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('admin.settingsPage');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isChangingPassword, setIsChangingPassword] = useState(false);  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('passwordsDoNotMatch'));
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error(t('passwordTooShort'));
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
        toast.error(result.error || t('passwordChangeFailed'));
        return;
      }

      toast.success(t('passwordChangedSuccess'));
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(t('passwordChangeFailed'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Password Change */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Key className="h-5 w-5 text-green-600" />
            <CardTitle>{t('passwordChange')}</CardTitle>
          </div>
          <CardDescription>
            {t('passwordChangeDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t('currentPassword')}</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ 
                  ...passwordForm, 
                  currentPassword: e.target.value 
                })}
                required
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('newPassword')}</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ 
                  ...passwordForm, 
                  newPassword: e.target.value 
                })}
                required
                minLength={8}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                {t('passwordMinLength')}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ 
                  ...passwordForm, 
                  confirmPassword: e.target.value 
                })}
                required
                minLength={8}
                className="w-full"
              />
            </div>

            <Button 
              type="submit" 
              disabled={isChangingPassword}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isChangingPassword ? t('changingPassword') : t('changePassword')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
