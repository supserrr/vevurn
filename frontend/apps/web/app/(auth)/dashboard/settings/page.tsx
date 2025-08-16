'use client';

import { useState } from 'react';
import { 
  Settings,
  Building,
  CreditCard,
  Receipt,
  Users,
  Shield,
  Bell,
  Palette,
  Printer,
  Wifi,
  Save,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SettingsPage() {
  const [businessSettings, setBusinessSettings] = useState({
    name: 'Vevurn Electronics',
    address: '123 KG Ave, Kigali',
    phone: '+250 788 123 456',
    email: 'info@vevurnelectronics.com',
    tin: 'TIN123456789',
    logo: null,
    currency: 'RWF',
    timezone: 'Africa/Kigali',
    language: 'en'
  });

  const [taxSettings, setTaxSettings] = useState({
    defaultTaxRate: 18,
    taxInclusive: true,
    taxNumber: 'VAT123456789'
  });

  const [receiptSettings, setReceiptSettings] = useState({
    showLogo: true,
    showAddress: true,
    showPhone: true,
    showEmail: true,
    footerMessage: 'Thank you for shopping with us!',
    paperSize: 'A4',
    copies: 1
  });

  const [notificationSettings, setNotificationSettings] = useState({
    lowStockAlerts: true,
    dailySummary: true,
    weeklyReports: false,
    salesNotifications: true,
    email: true,
    sms: false
  });

  const [userSettings, setUserSettings] = useState({
    autoLogout: 30,
    theme: 'system',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h'
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async (section: string) => {
    setSaving(true);
    
    // Mock save operation
    setTimeout(() => {
      setSaving(false);
      // Show success message
    }, 1000);
  };

  const handleBusinessChange = (field: string, value: string | number | boolean) => {
    setBusinessSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleTaxChange = (field: string, value: string | number | boolean) => {
    setTaxSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleReceiptChange = (field: string, value: string | number | boolean) => {
    setReceiptSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (field: string, value: string | number | boolean) => {
    setNotificationSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleUserChange = (field: string, value: string | number | boolean) => {
    setUserSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure your system preferences and business settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Save All
          </Button>
        </div>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span className="hidden sm:inline">Business</span>
          </TabsTrigger>
          <TabsTrigger value="tax" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Tax</span>
          </TabsTrigger>
          <TabsTrigger value="receipt" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Receipt</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">System</span>
          </TabsTrigger>
        </TabsList>

        {/* Business Settings */}
        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={businessSettings.name}
                    onChange={(e) => handleBusinessChange('name', e.target.value)}
                    placeholder="Enter business name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tin">TIN Number</Label>
                  <Input
                    id="tin"
                    value={businessSettings.tin}
                    onChange={(e) => handleBusinessChange('tin', e.target.value)}
                    placeholder="Enter TIN number"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Textarea
                  id="address"
                  value={businessSettings.address}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleBusinessChange('address', e.target.value)}
                  placeholder="Enter complete business address"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={businessSettings.phone}
                    onChange={(e) => handleBusinessChange('phone', e.target.value)}
                    placeholder="+250 788 123 456"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={businessSettings.email}
                    onChange={(e) => handleBusinessChange('email', e.target.value)}
                    placeholder="business@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={businessSettings.currency} onValueChange={(value: string) => handleBusinessChange('currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RWF">Rwandan Franc (RWF)</SelectItem>
                      <SelectItem value="USD">US Dollar (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={businessSettings.timezone} onValueChange={(value: string) => handleBusinessChange('timezone', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Kigali">Africa/Kigali (CAT)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={businessSettings.language} onValueChange={(value: string) => handleBusinessChange('language', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="rw">Kinyarwanda</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={() => handleSave('business')} disabled={saving}>
                  {saving && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  Save Business Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax Settings */}
        <TabsContent value="tax">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Tax Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    value={taxSettings.defaultTaxRate}
                    onChange={(e) => handleTaxChange('defaultTaxRate', parseFloat(e.target.value))}
                    placeholder="18"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxNumber">Tax/VAT Number</Label>
                  <Input
                    id="taxNumber"
                    value={taxSettings.taxNumber}
                    onChange={(e) => handleTaxChange('taxNumber', e.target.value)}
                    placeholder="VAT123456789"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h4 className="font-medium">Tax Inclusive Pricing</h4>
                  <p className="text-sm text-gray-600">
                    Display prices with tax included by default
                  </p>
                </div>
                <Switch
                  checked={taxSettings.taxInclusive}
                  onCheckedChange={(checked: boolean) => handleTaxChange('taxInclusive', checked)}
                />
              </div>

              <div className="pt-4">
                <Button onClick={() => handleSave('tax')} disabled={saving}>
                  {saving && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  Save Tax Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Receipt Settings */}
        <TabsContent value="receipt">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Receipt Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Receipt Content</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Show Business Logo</span>
                    <Switch
                      checked={receiptSettings.showLogo}
                      onCheckedChange={(checked: boolean) => handleReceiptChange('showLogo', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Show Address</span>
                    <Switch
                      checked={receiptSettings.showAddress}
                      onCheckedChange={(checked: boolean) => handleReceiptChange('showAddress', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Show Phone Number</span>
                    <Switch
                      checked={receiptSettings.showPhone}
                      onCheckedChange={(checked: boolean) => handleReceiptChange('showPhone', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Show Email</span>
                    <Switch
                      checked={receiptSettings.showEmail}
                      onCheckedChange={(checked: boolean) => handleReceiptChange('showEmail', checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="footerMessage">Footer Message</Label>
                <Textarea
                  id="footerMessage"
                  value={receiptSettings.footerMessage}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleReceiptChange('footerMessage', e.target.value)}
                  placeholder="Enter footer message for receipts"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="paperSize">Paper Size</Label>
                  <Select value={receiptSettings.paperSize} onValueChange={(value: string) => handleReceiptChange('paperSize', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4</SelectItem>
                      <SelectItem value="80mm">80mm Thermal</SelectItem>
                      <SelectItem value="58mm">58mm Thermal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="copies">Number of Copies</Label>
                  <Input
                    id="copies"
                    type="number"
                    value={receiptSettings.copies}
                    onChange={(e) => handleReceiptChange('copies', parseInt(e.target.value))}
                    min="1"
                    max="5"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={() => handleSave('receipt')} disabled={saving}>
                  {saving && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  Save Receipt Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Alert Types</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">Low Stock Alerts</div>
                      <div className="text-xs text-gray-600">Get notified when products are running low</div>
                    </div>
                    <Switch
                      checked={notificationSettings.lowStockAlerts}
                      onCheckedChange={(checked: boolean) => handleNotificationChange('lowStockAlerts', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">Daily Summary</div>
                      <div className="text-xs text-gray-600">Daily sales and activity summary</div>
                    </div>
                    <Switch
                      checked={notificationSettings.dailySummary}
                      onCheckedChange={(checked: boolean) => handleNotificationChange('dailySummary', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">Weekly Reports</div>
                      <div className="text-xs text-gray-600">Weekly business performance reports</div>
                    </div>
                    <Switch
                      checked={notificationSettings.weeklyReports}
                      onCheckedChange={(checked: boolean) => handleNotificationChange('weeklyReports', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">Sales Notifications</div>
                      <div className="text-xs text-gray-600">Real-time sales transaction alerts</div>
                    </div>
                    <Switch
                      checked={notificationSettings.salesNotifications}
                      onCheckedChange={(checked: boolean) => handleNotificationChange('salesNotifications', checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Delivery Methods</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Email Notifications</span>
                    <Switch
                      checked={notificationSettings.email}
                      onCheckedChange={(checked: boolean) => handleNotificationChange('email', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">SMS Notifications</span>
                    <Switch
                      checked={notificationSettings.sms}
                      onCheckedChange={(checked: boolean) => handleNotificationChange('sms', checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={() => handleSave('notifications')} disabled={saving}>
                  {saving && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Settings */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="autoLogout">Auto Logout (minutes)</Label>
                  <Select value={userSettings.autoLogout.toString()} onValueChange={(value: string) => handleUserChange('autoLogout', parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="0">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme Preference</Label>
                  <Select value={userSettings.theme} onValueChange={(value: string) => handleUserChange('theme', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select value={userSettings.dateFormat} onValueChange={(value: string) => handleUserChange('dateFormat', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeFormat">Time Format</Label>
                  <Select value={userSettings.timeFormat} onValueChange={(value: string) => handleUserChange('timeFormat', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12 Hour (AM/PM)</SelectItem>
                      <SelectItem value="24h">24 Hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={() => handleSave('users')} disabled={saving}>
                  {saving && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  Save User Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  System Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium text-sm">Two-Factor Authentication</div>
                    <div className="text-xs text-gray-600">Add extra security to your account</div>
                  </div>
                  <Badge variant="outline">Coming Soon</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium text-sm">Session Timeout</div>
                    <div className="text-xs text-gray-600">Auto-logout inactive users</div>
                  </div>
                  <Badge variant="default">Enabled</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Printer className="h-5 w-5" />
                  Hardware Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium text-sm">Receipt Printer</div>
                    <div className="text-xs text-gray-600">Configure thermal printer settings</div>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium text-sm">Barcode Scanner</div>
                    <div className="text-xs text-gray-600">Setup barcode scanning device</div>
                  </div>
                  <Button variant="outline" size="sm">Setup</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="h-5 w-5" />
                  Data & Backup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium text-sm">Automatic Backup</div>
                    <div className="text-xs text-gray-600">Daily data backup to cloud</div>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium text-sm">Export Data</div>
                    <div className="text-xs text-gray-600">Download your business data</div>
                  </div>
                  <Button variant="outline" size="sm">Export</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
