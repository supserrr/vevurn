'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Shield,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  Clock,
  Settings,
  MoreHorizontal,
  Key,
  Lock,
  Unlock,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';

// User interfaces
interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'CASHIER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
  permissions: string[];
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  loginAttempts: number;
  isLocked: boolean;
  department?: string;
  shift?: string;
}

interface UserFormData {
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  shift: string;
  permissions: string[];
}

// Mock users data
const mockUsers: User[] = [
  {
    id: 'USR-001',
    name: 'John Admin',
    email: 'admin@vevurn.rw',
    phone: '+250788123456',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-01-16T08:30:00Z',
    permissions: ['*'],
    emailVerified: true,
    phoneVerified: true,
    twoFactorEnabled: true,
    loginAttempts: 0,
    isLocked: false,
    department: 'Management',
    shift: 'Full Time',
  },
  {
    id: 'USR-002',
    name: 'Jane Manager',
    email: 'manager@vevurn.rw',
    phone: '+250788234567',
    role: 'MANAGER',
    status: 'ACTIVE',
    createdAt: '2024-01-05T00:00:00Z',
    lastLogin: '2024-01-16T07:45:00Z',
    permissions: ['products:read', 'products:write', 'sales:read', 'sales:write', 'customers:read', 'customers:write', 'reports:read'],
    emailVerified: true,
    phoneVerified: true,
    twoFactorEnabled: false,
    loginAttempts: 0,
    isLocked: false,
    department: 'Sales',
    shift: 'Morning',
  },
  {
    id: 'USR-003',
    name: 'Bob Cashier',
    email: 'cashier1@vevurn.rw',
    phone: '+250788345678',
    role: 'CASHIER',
    status: 'ACTIVE',
    createdAt: '2024-01-10T00:00:00Z',
    lastLogin: '2024-01-16T06:00:00Z',
    permissions: ['pos:use', 'sales:read', 'sales:write', 'customers:read'],
    emailVerified: true,
    phoneVerified: false,
    twoFactorEnabled: false,
    loginAttempts: 0,
    isLocked: false,
    department: 'POS',
    shift: 'Morning',
  },
  {
    id: 'USR-004',
    name: 'Alice Cashier',
    email: 'cashier2@vevurn.rw',
    phone: '+250788456789',
    role: 'CASHIER',
    status: 'ACTIVE',
    createdAt: '2024-01-12T00:00:00Z',
    lastLogin: '2024-01-15T14:30:00Z',
    permissions: ['pos:use', 'sales:read', 'sales:write', 'customers:read'],
    emailVerified: true,
    phoneVerified: true,
    twoFactorEnabled: false,
    loginAttempts: 2,
    isLocked: false,
    department: 'POS',
    shift: 'Evening',
  },
  {
    id: 'USR-005',
    name: 'Mike Suspended',
    email: 'suspended@vevurn.rw',
    phone: '+250788567890',
    role: 'CASHIER',
    status: 'SUSPENDED',
    createdAt: '2024-01-08T00:00:00Z',
    lastLogin: '2024-01-10T16:20:00Z',
    permissions: ['pos:use', 'sales:read'],
    emailVerified: false,
    phoneVerified: false,
    twoFactorEnabled: false,
    loginAttempts: 5,
    isLocked: true,
    department: 'POS',
    shift: 'Evening',
  },
];

const rolePermissions = {
  SUPER_ADMIN: ['*'],
  ADMIN: [
    'users:read', 'users:write', 'products:read', 'products:write', 
    'sales:read', 'sales:write', 'customers:read', 'customers:write',
    'reports:read', 'settings:read', 'settings:write'
  ],
  MANAGER: [
    'products:read', 'products:write', 'sales:read', 'sales:write',
    'customers:read', 'customers:write', 'reports:read'
  ],
  CASHIER: ['pos:use', 'sales:read', 'sales:write', 'customers:read'],
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    phone: '',
    role: 'CASHIER',
    department: '',
    shift: '',
    permissions: [],
  });

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      try {
        // In real app, fetch users from API
        // const response = await ApiClient.request('/users');
        // setUsers(response.data);
        
        // Using mock data for now
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error: any) {
        console.error('Failed to load users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery);
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ADMIN': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'MANAGER': return 'bg-green-100 text-green-800 border-green-200';
      case 'CASHIER': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 border-green-200';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'SUSPENDED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const openUserDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        department: user.department || '',
        shift: user.shift || '',
        permissions: user.permissions,
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'CASHIER',
        department: '',
        shift: '',
        permissions: rolePermissions.CASHIER,
      });
    }
    setShowUserDialog(true);
  };

  const saveUser = async () => {
    try {
      if (editingUser) {
        // Update existing user
        const updatedUser: User = {
          ...editingUser,
          ...formData,
          role: formData.role as User['role'],
          permissions: rolePermissions[formData.role as keyof typeof rolePermissions] || formData.permissions,
        };
        setUsers(prev => prev.map(u => u.id === editingUser.id ? updatedUser : u));
      } else {
        // Create new user
        const newUser: User = {
          id: `USR-${(users.length + 1).toString().padStart(3, '0')}`,
          ...formData,
          role: formData.role as User['role'],
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          permissions: rolePermissions[formData.role as keyof typeof rolePermissions] || [],
          emailVerified: false,
          phoneVerified: false,
          twoFactorEnabled: false,
          loginAttempts: 0,
          isLocked: false,
        };
        setUsers(prev => [...prev, newUser]);
      }
      setShowUserDialog(false);
    } catch (error: any) {
      console.error('Failed to save user:', error);
    }
  };

  const deleteUser = async (user: User) => {
    try {
      // In real app, call API to delete user
      // await ApiClient.request(`/users/${user.id}`, { method: 'DELETE' });
      
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setUserToDelete(null);
    } catch (error: any) {
      console.error('Failed to delete user:', error);
    }
  };

  const toggleUserStatus = async (user: User) => {
    try {
      const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      const updatedUser = { ...user, status: newStatus as User['status'] };
      setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    } catch (error: any) {
      console.error('Failed to update user status:', error);
    }
  };

  const unlockUser = async (user: User) => {
    try {
      const updatedUser = { ...user, isLocked: false, loginAttempts: 0 };
      setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    } catch (error: any) {
      console.error('Failed to unlock user:', error);
    }
  };

  const resetPassword = async (user: User) => {
    try {
      // In real app, call API to reset password
      console.log(`Password reset initiated for ${user.email}`);
      // Show success message
    } catch (error: any) {
      console.error('Failed to reset password:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded"></div>
        </div>
        <div className="h-96 bg-muted animate-pulse rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts, roles, and permissions
          </p>
        </div>

        <Button onClick={() => openUserDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="MANAGER">Manager</SelectItem>
            <SelectItem value="CASHIER">Cashier</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users ({filteredUsers.length})
          </CardTitle>
          <CardDescription>Manage your team members and their access levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{user.name}</h3>
                      {user.isLocked && (
                        <Lock className="h-4 w-4 text-red-500" />
                      )}
                      {user.twoFactorEnabled && (
                        <Shield className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{user.email}</span>
                      {!user.emailVerified && (
                        <Badge variant="outline" className="text-xs">Unverified Email</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{user.phone}</span>
                      {!user.phoneVerified && (
                        <Badge variant="outline" className="text-xs">Unverified Phone</Badge>
                      )}
                    </div>
                    {user.lastLogin && (
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Last login: {new Date(user.lastLogin).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right space-y-1">
                    <div className="flex gap-2">
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role.replace('_', ' ')}
                      </Badge>
                      <Badge className={getStatusBadgeColor(user.status)}>
                        {user.status}
                      </Badge>
                    </div>
                    {user.department && (
                      <p className="text-xs text-muted-foreground">
                        {user.department} • {user.shift}
                      </p>
                    )}
                    {user.loginAttempts > 0 && (
                      <p className="text-xs text-orange-600">
                        {user.loginAttempts} failed login attempts
                      </p>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openUserDialog(user)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit User
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => resetPassword(user)}>
                        <Key className="h-4 w-4 mr-2" />
                        Reset Password
                      </DropdownMenuItem>
                      {user.isLocked && (
                        <DropdownMenuItem onClick={() => unlockUser(user)}>
                          <Unlock className="h-4 w-4 mr-2" />
                          Unlock Account
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => toggleUserStatus(user)}>
                        {user.status === 'ACTIVE' ? (
                          <>
                            <UserX className="h-4 w-4 mr-2" />
                            Suspend User
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Activate User
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setUserToDelete(user)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Edit User' : 'Add New User'}
            </DialogTitle>
            <DialogDescription>
              {editingUser ? 'Update user information and permissions' : 'Create a new user account with appropriate access levels'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@vevurn.rw"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+250788123456"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: string) => setFormData(prev => ({ 
                    ...prev, 
                    role: value,
                    permissions: rolePermissions[value as keyof typeof rolePermissions] || []
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASHIER">Cashier</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value: string) => setFormData(prev => ({ ...prev, department: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Management">Management</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="POS">Point of Sale</SelectItem>
                    <SelectItem value="Inventory">Inventory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shift">Work Shift</Label>
                <Select
                  value={formData.shift}
                  onValueChange={(value: string) => setFormData(prev => ({ ...prev, shift: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full Time">Full Time</SelectItem>
                    <SelectItem value="Morning">Morning (6AM-2PM)</SelectItem>
                    <SelectItem value="Evening">Evening (2PM-10PM)</SelectItem>
                    <SelectItem value="Night">Night (10PM-6AM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Permissions Preview */}
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex flex-wrap gap-1">
                  {formData.permissions.map((permission) => (
                    <Badge key={permission} variant="outline" className="text-xs">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowUserDialog(false)}>
                Cancel
              </Button>
              <Button onClick={saveUser}>
                {editingUser ? 'Update User' : 'Create User'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      {userToDelete && (
        <AlertDialog open={true} onOpenChange={() => setUserToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {userToDelete.name}? This action cannot be undone.
                All data associated with this user will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteUser(userToDelete)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete User
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
