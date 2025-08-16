'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft,
  Gift,
  CreditCard,
  Plus,
  Minus,
  History,
  DollarSign,
  TrendingUp,
  Star,
  Award,
  AlertTriangle,
  Check,
  Calendar,
  Receipt,
  Target,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

// Enhanced interfaces for loyalty and credit management
interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  type: 'RETAIL' | 'WHOLESALE';
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  totalPurchases: number;
  totalOrders: number;
  loyaltyPoints: number;
  creditLimit?: number;
  outstandingBalance: number;
  dateJoined: string;
}

interface LoyaltyTransaction {
  id: string;
  customerId: string;
  type: 'EARNED' | 'REDEEMED' | 'ADJUSTED' | 'EXPIRED';
  points: number;
  reason: string;
  orderId?: string;
  date: string;
  expiryDate?: string;
  createdBy: string;
}

interface CreditTransaction {
  id: string;
  customerId: string;
  type: 'PURCHASE' | 'PAYMENT' | 'ADJUSTMENT' | 'INTEREST';
  amount: number;
  description: string;
  orderId?: string;
  date: string;
  createdBy: string;
}

interface LoyaltyTier {
  id: string;
  name: string;
  minSpent: number;
  pointsMultiplier: number;
  perks: string[];
  color: string;
}

// Mock data
const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'John Doe',
    phone: '+250788123456',
    email: 'john@example.com',
    type: 'RETAIL',
    status: 'ACTIVE',
    totalPurchases: 350000,
    totalOrders: 25,
    loyaltyPoints: 875,
    dateJoined: '2023-08-15',
    outstandingBalance: 0,
  },
  {
    id: '2',
    name: 'Jane Smith',
    phone: '+250788234567',
    email: 'jane@company.com',
    type: 'WHOLESALE',
    status: 'ACTIVE',
    totalPurchases: 1200000,
    totalOrders: 45,
    loyaltyPoints: 1200,
    creditLimit: 500000,
    outstandingBalance: 85000,
    dateJoined: '2023-06-20',
  },
];

const loyaltyTiers: LoyaltyTier[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    minSpent: 0,
    pointsMultiplier: 1,
    perks: ['1 point per 1000 RWF spent'],
    color: 'bg-amber-600',
  },
  {
    id: 'silver',
    name: 'Silver',
    minSpent: 200000,
    pointsMultiplier: 1.25,
    perks: ['1.25 points per 1000 RWF spent', '5% birthday discount'],
    color: 'bg-gray-400',
  },
  {
    id: 'gold',
    name: 'Gold',
    minSpent: 500000,
    pointsMultiplier: 1.5,
    perks: ['1.5 points per 1000 RWF spent', '10% birthday discount', 'Priority support'],
    color: 'bg-yellow-500',
  },
  {
    id: 'platinum',
    name: 'Platinum',
    minSpent: 1000000,
    pointsMultiplier: 2,
    perks: ['2 points per 1000 RWF spent', '15% birthday discount', 'Priority support', 'Free delivery'],
    color: 'bg-purple-600',
  },
];

const mockLoyaltyTransactions: LoyaltyTransaction[] = [
  {
    id: 'LT-001',
    customerId: '1',
    type: 'EARNED',
    points: 45,
    reason: 'Purchase - Order #ORD-123',
    orderId: 'ORD-123',
    date: '2024-01-10T14:30:00Z',
    createdBy: 'system',
  },
  {
    id: 'LT-002',
    customerId: '1',
    type: 'REDEEMED',
    points: -200,
    reason: 'Redeemed for discount',
    date: '2024-01-08T10:15:00Z',
    createdBy: 'admin',
  },
];

const mockCreditTransactions: CreditTransaction[] = [
  {
    id: 'CT-001',
    customerId: '2',
    type: 'PURCHASE',
    amount: 45000,
    description: 'Credit purchase - Order #ORD-456',
    orderId: 'ORD-456',
    date: '2024-01-10T14:30:00Z',
    createdBy: 'system',
  },
  {
    id: 'CT-002',
    customerId: '2',
    type: 'PAYMENT',
    amount: -40000,
    description: 'Payment received via bank transfer',
    date: '2024-01-09T09:20:00Z',
    createdBy: 'admin',
  },
];

export default function LoyaltyAndCreditPage() {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyTransaction[]>([]);
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);
  const [activeTab, setActiveTab] = useState<'loyalty' | 'credit'>('loyalty');
  
  // Forms state
  const [loyaltyForm, setLoyaltyForm] = useState({
    points: '',
    reason: '',
    type: 'EARNED' as LoyaltyTransaction['type'],
  });
  
  const [creditForm, setCreditForm] = useState({
    amount: '',
    description: '',
    type: 'ADJUSTMENT' as CreditTransaction['type'],
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (selectedCustomer) {
      // Load customer-specific transactions
      const customerLoyaltyTx = mockLoyaltyTransactions.filter(tx => tx.customerId === selectedCustomer.id);
      const customerCreditTx = mockCreditTransactions.filter(tx => tx.customerId === selectedCustomer.id);
      
      setLoyaltyTransactions(customerLoyaltyTx);
      setCreditTransactions(customerCreditTx);
    }
  }, [selectedCustomer]);

  const getLoyaltyTier = (customer: Customer): LoyaltyTier => {
    const tier = loyaltyTiers
      .slice()
      .reverse()
      .find(tier => customer.totalPurchases >= tier.minSpent);
    return tier ?? loyaltyTiers[0];
  };

  const getNextTier = (customer: Customer): LoyaltyTier | null => {
    const currentTier = getLoyaltyTier(customer);
    const currentTierIndex = loyaltyTiers.findIndex(tier => tier.id === currentTier.id);
    if (currentTierIndex < loyaltyTiers.length - 1) {
      return loyaltyTiers[currentTierIndex + 1] || null;
    }
    return null;
  };

  const handleLoyaltySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !loyaltyForm.points || !loyaltyForm.reason) return;

    setIsProcessing(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const points = loyaltyForm.type === 'REDEEMED' || loyaltyForm.type === 'EXPIRED' 
        ? -Math.abs(parseInt(loyaltyForm.points))
        : Math.abs(parseInt(loyaltyForm.points));

      // Update customer points
      const updatedCustomer = {
        ...selectedCustomer,
        loyaltyPoints: selectedCustomer.loyaltyPoints + points,
      };

      setSelectedCustomer(updatedCustomer);
      setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? updatedCustomer : c));

      // Add transaction record
      const newTransaction: LoyaltyTransaction = {
        id: `LT-${Date.now()}`,
        customerId: selectedCustomer.id,
        type: loyaltyForm.type,
        points,
        reason: loyaltyForm.reason,
        date: new Date().toISOString(),
        createdBy: 'admin',
      };

      setLoyaltyTransactions(prev => [newTransaction, ...prev]);

      // Reset form
      setLoyaltyForm({ points: '', reason: '', type: 'EARNED' });
      setSuccessMessage('Loyalty points updated successfully!');

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating loyalty points:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !creditForm.amount || !creditForm.description) return;

    setIsProcessing(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const amount = creditForm.type === 'PAYMENT' 
        ? -Math.abs(parseFloat(creditForm.amount))
        : Math.abs(parseFloat(creditForm.amount));

      // Update customer balance
      const updatedCustomer = {
        ...selectedCustomer,
        outstandingBalance: selectedCustomer.outstandingBalance + amount,
      };

      setSelectedCustomer(updatedCustomer);
      setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? updatedCustomer : c));

      // Add transaction record
      const newTransaction: CreditTransaction = {
        id: `CT-${Date.now()}`,
        customerId: selectedCustomer.id,
        type: creditForm.type,
        amount,
        description: creditForm.description,
        date: new Date().toISOString(),
        createdBy: 'admin',
      };

      setCreditTransactions(prev => [newTransaction, ...prev]);

      // Reset form
      setCreditForm({ amount: '', description: '', type: 'ADJUSTMENT' });
      setSuccessMessage('Credit balance updated successfully!');

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating credit balance:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/customers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Customers
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Loyalty & Credit Management</h1>
            <p className="text-muted-foreground">
              Manage customer loyalty points and credit accounts
            </p>
          </div>
        </div>
      </div>

      {successMessage && (
        <Alert>
          <Check className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Customer Selection */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Select Customer</CardTitle>
              <CardDescription>Choose a customer to manage their loyalty and credit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {customers.map((customer) => {
                const tier = getLoyaltyTier(customer);
                return (
                  <div
                    key={customer.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedCustomer?.id === customer.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-muted-foreground/50'
                    }`}
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">{customer.phone}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={`${tier.color} text-white border-0`}>
                          {tier.name}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {customer.loyaltyPoints} pts
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          {!selectedCustomer ? (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select a customer to manage their loyalty and credit</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Customer Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{selectedCustomer.name}</span>
                    <div className="flex gap-2">
                      <Badge variant={selectedCustomer.type === 'WHOLESALE' ? 'default' : 'outline'}>
                        {selectedCustomer.type}
                      </Badge>
                      <Badge variant="outline" className={`${getLoyaltyTier(selectedCustomer).color} text-white border-0`}>
                        {getLoyaltyTier(selectedCustomer).name}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Gift className="h-5 w-5 text-yellow-500" />
                        <span className="font-semibold">Loyalty Points</span>
                      </div>
                      <p className="text-2xl font-bold">{selectedCustomer.loyaltyPoints}</p>
                      <p className="text-sm text-muted-foreground">Available points</p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <DollarSign className="h-5 w-5 text-green-500" />
                        <span className="font-semibold">Total Spent</span>
                      </div>
                      <p className="text-2xl font-bold">{formatCurrency(selectedCustomer.totalPurchases)}</p>
                      <p className="text-sm text-muted-foreground">Lifetime value</p>
                    </div>

                    {selectedCustomer.type === 'WHOLESALE' && (
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <CreditCard className="h-5 w-5 text-blue-500" />
                          <span className="font-semibold">Credit Balance</span>
                        </div>
                        <p className={`text-2xl font-bold ${
                          selectedCustomer.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {formatCurrency(selectedCustomer.outstandingBalance)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Limit: {formatCurrency(selectedCustomer.creditLimit || 0)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Loyalty Tier Progress */}
                  {(() => {
                    const nextTier = getNextTier(selectedCustomer);
                    if (nextTier) {
                      const progress = (selectedCustomer.totalPurchases / nextTier.minSpent) * 100;
                      const remaining = nextTier.minSpent - selectedCustomer.totalPurchases;
                      return (
                        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Progress to {nextTier.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {formatCurrency(remaining)} to go
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </CardContent>
              </Card>

              {/* Tabs */}
              <div className="flex gap-1 p-1 bg-muted rounded-lg">
                <button
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'loyalty'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab('loyalty')}
                >
                  <Gift className="h-4 w-4 inline mr-2" />
                  Loyalty Management
                </button>
                {selectedCustomer.type === 'WHOLESALE' && (
                  <button
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'credit'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setActiveTab('credit')}
                  >
                    <CreditCard className="h-4 w-4 inline mr-2" />
                    Credit Management
                  </button>
                )}
              </div>

              {/* Loyalty Management */}
              {activeTab === 'loyalty' && (
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Loyalty Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Adjust Loyalty Points</CardTitle>
                      <CardDescription>Add, remove, or adjust customer loyalty points</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleLoyaltySubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Transaction Type</Label>
                          <select
                            value={loyaltyForm.type}
                            onChange={(e) => setLoyaltyForm(prev => ({ 
                              ...prev, 
                              type: e.target.value as LoyaltyTransaction['type'] 
                            }))}
                            className="w-full p-2 border border-input rounded-md bg-background"
                          >
                            <option value="EARNED">Earned Points</option>
                            <option value="REDEEMED">Redeemed Points</option>
                            <option value="ADJUSTED">Manual Adjustment</option>
                            <option value="EXPIRED">Expired Points</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="points">Points</Label>
                          <Input
                            id="points"
                            type="number"
                            value={loyaltyForm.points}
                            onChange={(e) => setLoyaltyForm(prev => ({ ...prev, points: e.target.value }))}
                            placeholder="Enter points amount"
                            min="1"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="reason">Reason</Label>
                          <Textarea
                            id="reason"
                            value={loyaltyForm.reason}
                            onChange={(e) => setLoyaltyForm(prev => ({ ...prev, reason: e.target.value }))}
                            placeholder="Reason for this transaction..."
                            rows={3}
                          />
                        </div>

                        <Button type="submit" disabled={isProcessing} className="w-full">
                          {isProcessing ? 'Processing...' : 'Update Points'}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Loyalty History */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Recent Transactions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {loyaltyTransactions.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">No transactions yet</p>
                        ) : (
                          loyaltyTransactions.slice(0, 5).map((transaction) => (
                            <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${
                                  transaction.type === 'EARNED' ? 'bg-green-100 text-green-600' :
                                  transaction.type === 'REDEEMED' ? 'bg-blue-100 text-blue-600' :
                                  transaction.type === 'ADJUSTED' ? 'bg-yellow-100 text-yellow-600' :
                                  'bg-red-100 text-red-600'
                                }`}>
                                  {transaction.type === 'EARNED' ? <Plus className="h-4 w-4" /> :
                                   transaction.type === 'REDEEMED' ? <Gift className="h-4 w-4" /> :
                                   transaction.type === 'ADJUSTED' ? <Target className="h-4 w-4" /> :
                                   <Minus className="h-4 w-4" />}
                                </div>
                                <div>
                                  <p className="font-medium">{transaction.reason}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(transaction.date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`font-semibold ${
                                  transaction.points > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {transaction.points > 0 ? '+' : ''}{transaction.points}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {transaction.type}
                                </Badge>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Credit Management */}
              {activeTab === 'credit' && selectedCustomer.type === 'WHOLESALE' && (
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Credit Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Adjust Credit Balance</CardTitle>
                      <CardDescription>Record payments or adjust credit balance</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleCreditSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Transaction Type</Label>
                          <select
                            value={creditForm.type}
                            onChange={(e) => setCreditForm(prev => ({ 
                              ...prev, 
                              type: e.target.value as CreditTransaction['type'] 
                            }))}
                            className="w-full p-2 border border-input rounded-md bg-background"
                          >
                            <option value="PAYMENT">Payment Received</option>
                            <option value="ADJUSTMENT">Manual Adjustment</option>
                            <option value="INTEREST">Interest Charge</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="amount">Amount (RWF)</Label>
                          <Input
                            id="amount"
                            type="number"
                            value={creditForm.amount}
                            onChange={(e) => setCreditForm(prev => ({ ...prev, amount: e.target.value }))}
                            placeholder="Enter amount"
                            min="0"
                            step="100"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={creditForm.description}
                            onChange={(e) => setCreditForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Description of this transaction..."
                            rows={3}
                          />
                        </div>

                        <Button type="submit" disabled={isProcessing} className="w-full">
                          {isProcessing ? 'Processing...' : 'Update Balance'}
                        </Button>
                      </form>

                      {selectedCustomer.creditLimit && selectedCustomer.outstandingBalance > (selectedCustomer.creditLimit * 0.8) && (
                        <Alert variant="destructive" className="mt-4">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            Customer is approaching credit limit. Consider payment collection.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  {/* Credit History */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Credit History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {creditTransactions.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">No transactions yet</p>
                        ) : (
                          creditTransactions.slice(0, 5).map((transaction) => (
                            <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${
                                  transaction.type === 'PAYMENT' ? 'bg-green-100 text-green-600' :
                                  transaction.type === 'PURCHASE' ? 'bg-blue-100 text-blue-600' :
                                  transaction.type === 'INTEREST' ? 'bg-red-100 text-red-600' :
                                  'bg-yellow-100 text-yellow-600'
                                }`}>
                                  {transaction.type === 'PAYMENT' ? <Minus className="h-4 w-4" /> :
                                   transaction.type === 'PURCHASE' ? <Plus className="h-4 w-4" /> :
                                   transaction.type === 'INTEREST' ? <TrendingUp className="h-4 w-4" /> :
                                   <Target className="h-4 w-4" />}
                                </div>
                                <div>
                                  <p className="font-medium">{transaction.description}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(transaction.date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`font-semibold ${
                                  transaction.amount > 0 ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {transaction.type}
                                </Badge>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Loyalty Tiers Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Loyalty Tiers
          </CardTitle>
          <CardDescription>Customer loyalty program tiers and benefits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {loyaltyTiers.map((tier) => (
              <div key={tier.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-4 h-4 rounded-full ${tier.color}`}></div>
                  <h3 className="font-semibold">{tier.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Spend {formatCurrency(tier.minSpent)}+
                </p>
                <ul className="space-y-1">
                  {tier.perks.map((perk, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <Check className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
