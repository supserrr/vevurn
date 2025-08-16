'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings,
  Store,
  DollarSign,
  Globe,
  Shield,
  Bell,
  Palette,
  Database,
  Wifi,
  Printer,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Building,
  Phone,
  Mail,
  MapPin,
  Clock,
  CreditCard,
  Receipt,
  TrendingUp,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Settings interfaces
interface BusinessSettings {
  storeName: string;
  storeDescription: string;
  businessRegistration: string;
  tinNumber: string;
  address: {
    street: string;
    district: string;
    sector: string;
    cell: string;
    province: string;
    postalCode: string;
  };
  contact: {
    phone: string;
    email: string;
    website: string;
  };
  operatingHours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
}

interface SystemSettings {
  currency: string;
  taxRate: number;
  taxNumber: string;
  dateFormat: string;
  timeFormat: string;
  timezone: string;
  language: string;
  defaultPaymentMethod: string;
  receiptSettings: {
    showLogo: boolean;
    showBusinessInfo: boolean;
    showTaxInfo: boolean;
    footerMessage: string;
    receiptWidth: string;
  };
}

interface NotificationSettings {
  lowStockAlerts: boolean;
  lowStockThreshold: number;
  dailyReports: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
  salesNotifications: boolean;
  customerNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

interface SecuritySettings {
  sessionTimeout: number;
  passwordExpiry: number;
  maxLoginAttempts: number;
  twoFactorAuth: boolean;
  auditLogging: boolean;
  backupFrequency: string;
  dataRetention: number;
}

// Mock settings data
const mockBusinessSettings: BusinessSettings = {
  storeName: 'Vevurn Electronics',
  storeDescription: 'Premium phone accessories and electronics retailer in Rwanda',
  businessRegistration: 'RCA/123456789',
  tinNumber: '123456789',
  address: {
    street: 'KN 4 Ave, Kimisagara',
    district: 'Nyarugenge',
    sector: 'Kimisagara',
    cell: 'Rugenge',
    province: 'Kigali City',
    postalCode: 'KG 11 Ave',
  },
  contact: {
    phone: '+250788123456',
    email: 'info@vevurn.rw',
    website: 'www.vevurn.rw',
  },
  operatingHours: {
    monday: { open: '08:00', close: '20:00', closed: false },
    tuesday: { open: '08:00', close: '20:00', closed: false },
    wednesday: { open: '08:00', close: '20:00', closed: false },
    thursday: { open: '08:00', close: '20:00', closed: false },
    friday: { open: '08:00', close: '20:00', closed: false },
    saturday: { open: '08:00', close: '22:00', closed: false },
    sunday: { open: '10:00', close: '18:00', closed: false },
  },
};

const mockSystemSettings: SystemSettings = {
  currency: 'RWF',
  taxRate: 18,
  taxNumber: 'VAT123456789',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  timezone: 'Africa/Kigali',
  language: 'en',
  defaultPaymentMethod: 'cash',
  receiptSettings: {
    showLogo: true,
    showBusinessInfo: true,
    showTaxInfo: true,
    footerMessage: 'Thank you for shopping with us!',
    receiptWidth: '80mm',
  },
};

const mockNotificationSettings: NotificationSettings = {
  lowStockAlerts: true,
  lowStockThreshold: 10,
  dailyReports: true,
  weeklyReports: true,
  monthlyReports: true,
  salesNotifications: true,
  customerNotifications: false,
  emailNotifications: true,
  smsNotifications: false,
};

const mockSecuritySettings: SecuritySettings = {
  sessionTimeout: 480, // 8 hours in minutes
  passwordExpiry: 90, // days
  maxLoginAttempts: 5,
  twoFactorAuth: false,
  auditLogging: true,
  backupFrequency: 'daily',
  dataRetention: 365, // days
};

export default function SettingsPage() {
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(mockBusinessSettings);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(mockSystemSettings);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(mockNotificationSettings);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(mockSecuritySettings);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        // In real app, fetch settings from API
        // const response = await ApiClient.request('/settings');
        // setBusinessSettings(response.data.business);
        // setSystemSettings(response.data.system);
        // setNotificationSettings(response.data.notifications);
        // setSecuritySettings(response.data.security);
        
        // Using mock data for now
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error: any) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const saveSettings = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    
    try {
      // In real app, save settings to API
      // await ApiClient.request('/settings', {
      //   method: 'PUT',
      //   body: JSON.stringify({
      //     business: businessSettings,
      //     system: systemSettings,
      //     notifications: notificationSettings,
      //     security: securitySettings,
      //   }),
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSaveStatus('success');
      
      // Reset status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const updateBusinessSettings = (field: string, value: any) => {
    setBusinessSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateNestedBusinessSettings = (section: string, field: string, value: any) => {
    setBusinessSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof BusinessSettings],
        [field]: value,
      },
    }));
  };

  const updateSystemSettings = (field: keyof SystemSettings, value: any) => {
    setSystemSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateNotificationSettings = (field: keyof NotificationSettings, value: any) => {
    setNotificationSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateSecuritySettings = (field: keyof SecuritySettings, value: any) => {
    setSecuritySettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded"></div>
        </div>
        <div className="grid gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-96 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">
            Configure your business settings, system preferences, and security options
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.reload()}
            disabled={isSaving}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button 
            size="sm" 
            onClick={saveSettings}
            disabled={isSaving}
          >
            {isSaving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Save Status */}
      {saveStatus !== 'idle' && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          saveStatus === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {saveStatus === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertTriangle className="h-5 w-5" />
          )}
          <span className="font-medium">
            {saveStatus === 'success' ? 'Settings saved successfully!' : 'Failed to save settings. Please try again.'}
          </span>
        </div>
      )}

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Business Information
          </CardTitle>
          <CardDescription>Basic information about your business</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="storeName">Store Name</Label>
              <Input
                id="storeName"
                value={businessSettings.storeName}
                onChange={(e) => updateBusinessSettings('storeName', e.target.value)}
                placeholder="Your store name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessRegistration">Business Registration</Label>
              <Input
                id="businessRegistration"
                value={businessSettings.businessRegistration}
                onChange={(e) => updateBusinessSettings('businessRegistration', e.target.value)}
                placeholder="RCA/123456789"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeDescription">Store Description</Label>
            <Textarea
              id="storeDescription"
              value={businessSettings.storeDescription}
              onChange={(e) => updateBusinessSettings('storeDescription', e.target.value)}
              placeholder="Brief description of your business"
              rows={3}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tinNumber">TIN Number</Label>
              <Input
                id="tinNumber"
                value={businessSettings.tinNumber}
                onChange={(e) => updateBusinessSettings('tinNumber', e.target.value)}
                placeholder="Tax Identification Number"
              />
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Business Address
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={businessSettings.address.street}
                  onChange={(e) => updateNestedBusinessSettings('address', 'street', e.target.value)}
                  placeholder="Street address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Select
                  value={businessSettings.address.district}
                  onValueChange={(value) => updateNestedBusinessSettings('address', 'district', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nyarugenge">Nyarugenge</SelectItem>
                    <SelectItem value="Gasabo">Gasabo</SelectItem>
                    <SelectItem value="Kicukiro">Kicukiro</SelectItem>
                    <SelectItem value="Nyanza">Nyanza</SelectItem>
                    <SelectItem value="Gisagara">Gisagara</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sector">Sector</Label>
                <Input
                  id="sector"
                  value={businessSettings.address.sector}
                  onChange={(e) => updateNestedBusinessSettings('address', 'sector', e.target.value)}
                  placeholder="Sector"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cell">Cell</Label>
                <Input
                  id="cell"
                  value={businessSettings.address.cell}
                  onChange={(e) => updateNestedBusinessSettings('address', 'cell', e.target.value)}
                  placeholder="Cell"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="province">Province</Label>
                <Select
                  value={businessSettings.address.province}
                  onValueChange={(value) => updateNestedBusinessSettings('address', 'province', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kigali City">Kigali City</SelectItem>
                    <SelectItem value="Northern Province">Northern Province</SelectItem>
                    <SelectItem value="Southern Province">Southern Province</SelectItem>
                    <SelectItem value="Eastern Province">Eastern Province</SelectItem>
                    <SelectItem value="Western Province">Western Province</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={businessSettings.address.postalCode}
                  onChange={(e) => updateNestedBusinessSettings('address', 'postalCode', e.target.value)}
                  placeholder="Postal code"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={businessSettings.contact.phone}
                  onChange={(e) => updateNestedBusinessSettings('contact', 'phone', e.target.value)}
                  placeholder="+250788123456"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={businessSettings.contact.email}
                  onChange={(e) => updateNestedBusinessSettings('contact', 'email', e.target.value)}
                  placeholder="info@yourstore.rw"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={businessSettings.contact.website}
                  onChange={(e) => updateNestedBusinessSettings('contact', 'website', e.target.value)}
                  placeholder="www.yourstore.rw"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Configuration
          </CardTitle>
          <CardDescription>Configure system-wide settings and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={systemSettings.currency}
                onValueChange={(value) => updateSystemSettings('currency', value)}
              >
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
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                value={systemSettings.taxRate}
                onChange={(e) => updateSystemSettings('taxRate', parseFloat(e.target.value))}
                placeholder="18"
                min="0"
                max="100"
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxNumber">VAT Number</Label>
              <Input
                id="taxNumber"
                value={systemSettings.taxNumber}
                onChange={(e) => updateSystemSettings('taxNumber', e.target.value)}
                placeholder="VAT123456789"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFormat">Date Format</Label>
              <Select
                value={systemSettings.dateFormat}
                onValueChange={(value) => updateSystemSettings('dateFormat', value)}
              >
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
              <Select
                value={systemSettings.timeFormat}
                onValueChange={(value) => updateSystemSettings('timeFormat', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24 Hour</SelectItem>
                  <SelectItem value="12h">12 Hour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={systemSettings.timezone}
                onValueChange={(value) => updateSystemSettings('timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Africa/Kigali">Africa/Kigali</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="Africa/Nairobi">Africa/Nairobi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultPaymentMethod">Default Payment Method</Label>
            <Select
              value={systemSettings.defaultPaymentMethod}
              onValueChange={(value) => updateSystemSettings('defaultPaymentMethod', value)}
            >
              <SelectTrigger className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>Configure alerts and automated reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="lowStockAlerts">Low Stock Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified when products are running low</p>
              </div>
              <Switch
                id="lowStockAlerts"
                checked={notificationSettings.lowStockAlerts}
                onCheckedChange={(checked) => updateNotificationSettings('lowStockAlerts', checked)}
              />
            </div>

            {notificationSettings.lowStockAlerts && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  value={notificationSettings.lowStockThreshold}
                  onChange={(e) => updateNotificationSettings('lowStockThreshold', parseInt(e.target.value))}
                  className="max-w-xs"
                  min="1"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dailyReports">Daily Reports</Label>
                <p className="text-sm text-muted-foreground">Receive daily sales and inventory reports</p>
              </div>
              <Switch
                id="dailyReports"
                checked={notificationSettings.dailyReports}
                onCheckedChange={(checked) => updateNotificationSettings('dailyReports', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="weeklyReports">Weekly Reports</Label>
                <p className="text-sm text-muted-foreground">Receive weekly business summary reports</p>
              </div>
              <Switch
                id="weeklyReports"
                checked={notificationSettings.weeklyReports}
                onCheckedChange={(checked) => updateNotificationSettings('weeklyReports', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="monthlyReports">Monthly Reports</Label>
                <p className="text-sm text-muted-foreground">Receive monthly analytics and insights</p>
              </div>
              <Switch
                id="monthlyReports"
                checked={notificationSettings.monthlyReports}
                onCheckedChange={(checked) => updateNotificationSettings('monthlyReports', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="salesNotifications">Sales Notifications</Label>
                <p className="text-sm text-muted-foreground">Get notified about important sales events</p>
              </div>
              <Switch
                id="salesNotifications"
                checked={notificationSettings.salesNotifications}
                onCheckedChange={(checked) => updateNotificationSettings('salesNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
              <Switch
                id="emailNotifications"
                checked={notificationSettings.emailNotifications}
                onCheckedChange={(checked) => updateNotificationSettings('emailNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="smsNotifications">SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
              </div>
              <Switch
                id="smsNotifications"
                checked={notificationSettings.smsNotifications}
                onCheckedChange={(checked) => updateNotificationSettings('smsNotifications', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>Configure security policies and access controls</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={securitySettings.sessionTimeout}
                onChange={(e) => updateSecuritySettings('sessionTimeout', parseInt(e.target.value))}
                min="15"
                max="1440"
              />
              <p className="text-sm text-muted-foreground">
                Users will be logged out after this period of inactivity
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                value={securitySettings.maxLoginAttempts}
                onChange={(e) => updateSecuritySettings('maxLoginAttempts', parseInt(e.target.value))}
                min="3"
                max="10"
              />
              <p className="text-sm text-muted-foreground">
                Account will be locked after this many failed attempts
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Require 2FA for all user accounts</p>
              </div>
              <Switch
                id="twoFactorAuth"
                checked={securitySettings.twoFactorAuth}
                onCheckedChange={(checked) => updateSecuritySettings('twoFactorAuth', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auditLogging">Audit Logging</Label>
                <p className="text-sm text-muted-foreground">Log all user actions for security auditing</p>
              </div>
              <Switch
                id="auditLogging"
                checked={securitySettings.auditLogging}
                onCheckedChange={(checked) => updateSecuritySettings('auditLogging', checked)}
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="backupFrequency">Backup Frequency</Label>
              <Select
                value={securitySettings.backupFrequency}
                onValueChange={(value) => updateSecuritySettings('backupFrequency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataRetention">Data Retention (days)</Label>
              <Input
                id="dataRetention"
                type="number"
                value={securitySettings.dataRetention}
                onChange={(e) => updateSecuritySettings('dataRetention', parseInt(e.target.value))}
                min="30"
                max="2555" // 7 years
              />
              <p className="text-sm text-muted-foreground">
                How long to keep transaction and audit data
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
