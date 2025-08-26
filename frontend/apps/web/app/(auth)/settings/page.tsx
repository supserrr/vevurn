'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building, 
  Receipt, 
  Bell, 
  Shield, 
  CreditCard,
  Users,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [settings, setSettings] = useState({
    // Business Settings
    businessName: 'Vevurn POS',
    businessAddress: 'Kigali, Rwanda',
    businessPhone: '+250788123456',
    businessEmail: 'info@vevurn.com',
    taxNumber: 'TIN123456789',
    currency: 'RWF',
    taxRate: '18',
    
    // Receipt Settings
    receiptHeader: 'Thank you for your business!',
    receiptFooter: 'Visit us again soon',
    showLogo: true,
    printAfterSale: true,
    receiptCopies: '1',
    
    // Notification Settings
    lowStockAlerts: true,
    salesNotifications: false,
    emailNotifications: true,
    smsNotifications: false,
    lowStockThreshold: '10',
    
    // Security Settings
    sessionTimeout: '30',
    requirePasswordChange: false,
    enableAuditLog: true,
    enableTwoFactor: false,
    
    // Payment Settings
    mtnApiKey: '••••••••••••••••',
    airtelApiKey: '••••••••••••••••',
    enableCash: true,
    enableMobileMoney: true,
    enableBankTransfer: true,
    enableCredit: false,
    
    // User Management
    maxUsers: '10',
    defaultRole: 'CASHIER'
  });

  const handleSettingChange = (key: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = async () => {
    try {
      // Mock save - in real implementation, this would call the API
      console.log('Saving settings:', settings);
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  const testConnection = async (service: string) => {
    toast.loading(`Testing ${service} connection...`);
    
    // Mock test - in real implementation, this would test the actual connection
    setTimeout(() => {
      toast.dismiss();
      toast.success(`${service} connection successful!`);
    }, 2000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Button onClick={saveSettings}>
          <Save className="h-4 w-4 mr-2" />
          Save All Changes
        </Button>
      </div>

      <Tabs defaultValue="business" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="receipt">Receipt</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        {/* Business Settings */}
        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={settings.businessName}
                    onChange={(e) => handleSettingChange('businessName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="taxNumber">Tax Number (TIN)</Label>
                  <Input
                    id="taxNumber"
                    value={settings.taxNumber}
                    onChange={(e) => handleSettingChange('taxNumber', e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="businessAddress">Address</Label>
                <Textarea
                  id="businessAddress"
                  value={settings.businessAddress}
                  onChange={(e) => handleSettingChange('businessAddress', e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessPhone">Phone</Label>
                  <Input
                    id="businessPhone"
                    value={settings.businessPhone}
                    onChange={(e) => handleSettingChange('businessPhone', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="businessEmail">Email</Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    value={settings.businessEmail}
                    onChange={(e) => handleSettingChange('businessEmail', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={settings.currency} onValueChange={(value) => handleSettingChange('currency', value)}>
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
                <div>
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    value={settings.taxRate}
                    onChange={(e) => handleSettingChange('taxRate', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Receipt Settings */}
        <TabsContent value="receipt">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Receipt className="h-5 w-5 mr-2" />
                Receipt Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="receiptHeader">Receipt Header</Label>
                <Input
                  id="receiptHeader"
                  value={settings.receiptHeader}
                  onChange={(e) => handleSettingChange('receiptHeader', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="receiptFooter">Receipt Footer</Label>
                <Input
                  id="receiptFooter"
                  value={settings.receiptFooter}
                  onChange={(e) => handleSettingChange('receiptFooter', e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="showLogo"
                  checked={settings.showLogo}
                  onCheckedChange={(checked) => handleSettingChange('showLogo', checked)}
                />
                <Label htmlFor="showLogo">Show logo on receipt</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="printAfterSale"
                  checked={settings.printAfterSale}
                  onCheckedChange={(checked) => handleSettingChange('printAfterSale', checked)}
                />
                <Label htmlFor="printAfterSale">Auto-print receipt after sale</Label>
              </div>
              
              <div>
                <Label htmlFor="receiptCopies">Number of receipt copies</Label>
                <Select value={settings.receiptCopies} onValueChange={(value) => handleSettingChange('receiptCopies', value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 copy</SelectItem>
                    <SelectItem value="2">2 copies</SelectItem>
                    <SelectItem value="3">3 copies</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="lowStockAlerts"
                    checked={settings.lowStockAlerts}
                    onCheckedChange={(checked) => handleSettingChange('lowStockAlerts', checked)}
                  />
                  <Label htmlFor="lowStockAlerts">Low stock alerts</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="salesNotifications"
                    checked={settings.salesNotifications}
                    onCheckedChange={(checked) => handleSettingChange('salesNotifications', checked)}
                  />
                  <Label htmlFor="salesNotifications">Daily sales notifications</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="emailNotifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                  />
                  <Label htmlFor="emailNotifications">Email notifications</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="smsNotifications"
                    checked={settings.smsNotifications}
                    onCheckedChange={(checked) => handleSettingChange('smsNotifications', checked)}
                  />
                  <Label htmlFor="smsNotifications">SMS notifications</Label>
                </div>
              </div>
              
              <div>
                <Label htmlFor="lowStockThreshold">Low stock threshold</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  value={settings.lowStockThreshold}
                  onChange={(e) => handleSettingChange('lowStockThreshold', e.target.value)}
                  className="w-32"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Security Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sessionTimeout">Session timeout (minutes)</Label>
                <Select value={settings.sessionTimeout} onValueChange={(value) => handleSettingChange('sessionTimeout', value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="requirePasswordChange"
                    checked={settings.requirePasswordChange}
                    onCheckedChange={(checked) => handleSettingChange('requirePasswordChange', checked)}
                  />
                  <Label htmlFor="requirePasswordChange">Require password change every 90 days</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableAuditLog"
                    checked={settings.enableAuditLog}
                    onCheckedChange={(checked) => handleSettingChange('enableAuditLog', checked)}
                  />
                  <Label htmlFor="enableAuditLog">Enable audit logging</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableTwoFactor"
                    checked={settings.enableTwoFactor}
                    onCheckedChange={(checked) => handleSettingChange('enableTwoFactor', checked)}
                  />
                  <Label htmlFor="enableTwoFactor">Enable two-factor authentication</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Payment Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Methods */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Enabled Payment Methods</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableCash"
                      checked={settings.enableCash}
                      onCheckedChange={(checked) => handleSettingChange('enableCash', checked)}
                    />
                    <Label htmlFor="enableCash">Cash payments</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableMobileMoney"
                      checked={settings.enableMobileMoney}
                      onCheckedChange={(checked) => handleSettingChange('enableMobileMoney', checked)}
                    />
                    <Label htmlFor="enableMobileMoney">Mobile Money (MTN/Airtel)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableBankTransfer"
                      checked={settings.enableBankTransfer}
                      onCheckedChange={(checked) => handleSettingChange('enableBankTransfer', checked)}
                    />
                    <Label htmlFor="enableBankTransfer">Bank transfers</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableCredit"
                      checked={settings.enableCredit}
                      onCheckedChange={(checked) => handleSettingChange('enableCredit', checked)}
                    />
                    <Label htmlFor="enableCredit">Credit sales</Label>
                  </div>
                </div>
              </div>

              {/* API Keys */}
              <div>
                <h3 className="text-lg font-semibold mb-4">API Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="mtnApiKey">MTN Mobile Money API Key</Label>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowApiKeys(!showApiKeys)}
                        >
                          {showApiKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testConnection('MTN Mobile Money')}
                        >
                          Test
                        </Button>
                      </div>
                    </div>
                    <Input
                      id="mtnApiKey"
                      type={showApiKeys ? 'text' : 'password'}
                      value={settings.mtnApiKey}
                      onChange={(e) => handleSettingChange('mtnApiKey', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="airtelApiKey">Airtel Money API Key</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testConnection('Airtel Money')}
                      >
                        Test
                      </Button>
                    </div>
                    <Input
                      id="airtelApiKey"
                      type={showApiKeys ? 'text' : 'password'}
                      value={settings.airtelApiKey}
                      onChange={(e) => handleSettingChange('airtelApiKey', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Management */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="maxUsers">Maximum number of users</Label>
                <Select value={settings.maxUsers} onValueChange={(value) => handleSettingChange('maxUsers', value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 users</SelectItem>
                    <SelectItem value="10">10 users</SelectItem>
                    <SelectItem value="20">20 users</SelectItem>
                    <SelectItem value="50">50 users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="defaultRole">Default role for new users</Label>
                <Select value={settings.defaultRole} onValueChange={(value) => handleSettingChange('defaultRole', value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASHIER">Cashier</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
