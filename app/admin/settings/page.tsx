import { AdminAuthWrapper } from '@/components/admin/admin-auth-wrapper'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, Database, Shield, Bell } from 'lucide-react'

export default function AdminSettingsPage() {
  return (
    <AdminAuthWrapper>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            <p className="text-muted-foreground">
              Configure your admin dashboard and application settings
            </p>
          </div>

          <div className="grid gap-6">
            {/* General Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <CardTitle>General Settings</CardTitle>
                </div>
                <CardDescription>
                  Basic configuration for your application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="app-name">Application Name</Label>
                    <Input id="app-name" defaultValue="Admin Dashboard" />
                  </div>
                  <div>
                    <Label htmlFor="app-url">Application URL</Label>
                    <Input id="app-url" defaultValue="https://your-app.com" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="app-description">Description</Label>
                  <Input id="app-description" defaultValue="User management dashboard" />
                </div>
                <Button>Save General Settings</Button>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <CardTitle>Security Settings</CardTitle>
                </div>
                <CardDescription>
                  Configure security and authentication settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                    <Input id="session-timeout" type="number" defaultValue="60" />
                  </div>
                  <div>
                    <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                    <Input id="max-login-attempts" type="number" defaultValue="5" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="require-2fa" className="rounded" />
                  <Label htmlFor="require-2fa">Require Two-Factor Authentication for Admins</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="email-verification" className="rounded" defaultChecked />
                  <Label htmlFor="email-verification">Require Email Verification for New Users</Label>
                </div>
                <Button>Save Security Settings</Button>
              </CardContent>
            </Card>

            {/* Database Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <CardTitle>Database Settings</CardTitle>
                </div>
                <CardDescription>
                  Database maintenance and backup configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Database Status</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600">Connected</span>
                    </div>
                  </div>
                  <div>
                    <Label>Last Backup</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline">Run Backup Now</Button>
                  <Button variant="outline">View Backup History</Button>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <CardTitle>Notification Settings</CardTitle>
                </div>
                <CardDescription>
                  Configure email and system notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="admin-email">Admin Email</Label>
                  <Input id="admin-email" type="email" defaultValue="admin@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Email Notifications</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="new-user-notifications" className="rounded" defaultChecked />
                      <Label htmlFor="new-user-notifications">New user registrations</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="security-alerts" className="rounded" defaultChecked />
                      <Label htmlFor="security-alerts">Security alerts</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="system-updates" className="rounded" />
                      <Label htmlFor="system-updates">System updates</Label>
                    </div>
                  </div>
                </div>
                <Button>Save Notification Settings</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </AdminAuthWrapper>
  )
}
