'use client';

import { User } from '@/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bell, Search, Moon, Sun, LogOut, User as UserIcon, Settings } from 'lucide-react';
import { getInitials, formatDateTime } from '@/lib/utils';
import { authClient } from '@/lib/auth';
import { useTheme } from 'next-themes';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

interface HeaderProps {
  user: User;
}

export function Header({ user }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(() => {
      authClient.signOut().then(() => {
        toast.success('Signed out successfully');
        router.push('/login');
        router.refresh();
      }).catch(() => {
        toast.error('Failed to sign out');
      });
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'CASHIER':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products, customers, sales..."
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs"></span>
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {user.role}
                  </Badge>
                </div>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
                {user.employeeId && (
                  <p className="text-xs leading-none text-muted-foreground">
                    ID: {user.employeeId}
                  </p>
                )}
                {user.lastLoginAt && (
                  <p className="text-xs leading-none text-muted-foreground">
                    Last login: {formatDateTime(user.lastLoginAt)}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Button variant="ghost" className="w-full justify-start">
                <UserIcon className="mr-2 h-4 w-4" />
                Profile
              </Button>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
