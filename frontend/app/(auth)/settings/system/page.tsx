'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Monitor,
  Database,
  Server,
  Cpu,
  HardDrive,
  Activity,
  Wifi,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Calendar,
  Clock,
  Users,
  ShoppingCart,
  Package,
  TrendingUp,
  Zap,
  Globe,
  Shield,
  Eye,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// System monitoring interfaces
interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  lastRestart: string;
  cpu: {
    usage: number;
    temperature: number;
    cores: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  storage: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    status: 'connected' | 'disconnected' | 'slow';
    speed: number;
    latency: number;
  };
}

interface DatabaseMetrics {
  status: 'online' | 'offline' | 'maintenance';
  connections: {
    active: number;
    max: number;
    idle: number;
  };
  performance: {
    queryTime: number;
    slowQueries: number;
    cacheHitRatio: number;
  };
  storage: {
    size: number;
    growth: number;
    backupStatus: 'success' | 'failed' | 'pending';
    lastBackup: string;
  };
}

interface ApplicationMetrics {
  activeUsers: number;
  sessionsToday: number;
  requestsPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
  featuresUsage: {
    feature: string;
    usage: number;
    trend: 'up' | 'down' | 'stable';
  }[];
}

interface SecurityMetrics {
  threats: {
    blocked: number;
    level: 'low' | 'medium' | 'high';
  };
  loginAttempts: {
    successful: number;
    failed: number;
    blocked: number;
  };
  auditLogs: {
    total: number;
    critical: number;
    warnings: number;
  };
  lastSecurityScan: string;
}

interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  component: string;
  message: string;
  details?: string;
}

// Mock system data
const mockSystemHealth: SystemHealth = {
  status: 'healthy',
  uptime: 432156, // seconds
  lastRestart: '2024-01-10T08:00:00Z',
  cpu: {
    usage: 24.5,
    temperature: 45,
    cores: 4,
  },
  memory: {
    used: 3.2,
    total: 8,
    percentage: 40,
  },
  storage: {
    used: 285,
    total: 500,
    percentage: 57,
  },
  network: {
    status: 'connected',
    speed: 100,
    latency: 12,
  },
};

const mockDatabaseMetrics: DatabaseMetrics = {
  status: 'online',
  connections: {
    active: 8,
    max: 100,
    idle: 12,
  },
  performance: {
    queryTime: 45,
    slowQueries: 2,
    cacheHitRatio: 94.5,
  },
  storage: {
    size: 2.4,
    growth: 12.5,
    backupStatus: 'success',
    lastBackup: '2024-01-16T02:00:00Z',
  },
};

const mockApplicationMetrics: ApplicationMetrics = {
  activeUsers: 12,
  sessionsToday: 45,
  requestsPerMinute: 125,
  averageResponseTime: 185,
  errorRate: 0.2,
  featuresUsage: [
    { feature: 'POS System', usage: 89, trend: 'up' },
    { feature: 'Product Management', usage: 67, trend: 'stable' },
    { feature: 'Customer Management', usage: 45, trend: 'up' },
    { feature: 'Reports', usage: 34, trend: 'down' },
    { feature: 'Settings', usage: 12, trend: 'stable' },
  ],
};

const mockSecurityMetrics: SecurityMetrics = {
  threats: {
    blocked: 23,
    level: 'low',
  },
  loginAttempts: {
    successful: 156,
    failed: 8,
    blocked: 2,
  },
  auditLogs: {
    total: 1245,
    critical: 0,
    warnings: 3,
  },
  lastSecurityScan: '2024-01-16T06:00:00Z',
};

const mockSystemLogs: SystemLog[] = [
  {
    id: 'LOG-001',
    timestamp: '2024-01-16T10:30:00Z',
    level: 'info',
    component: 'AUTH',
    message: 'User login successful',
    details: 'User: admin@vevurn.rw from IP: 192.168.1.100',
  },
  {
    id: 'LOG-002',
    timestamp: '2024-01-16T10:25:00Z',
    level: 'warning',
    component: 'DATABASE',
    message: 'Slow query detected',
    details: 'Query execution time: 2.5s - SELECT * FROM products WHERE...',
  },
  {
    id: 'LOG-003',
    timestamp: '2024-01-16T10:20:00Z',
    level: 'info',
    component: 'POS',
    message: 'Sale completed',
    details: 'Sale ID: SALE-789, Amount: RWF 45,000',
  },
  {
    id: 'LOG-004',
    timestamp: '2024-01-16T10:15:00Z',
    level: 'error',
    component: 'PAYMENT',
    message: 'Mobile money payment failed',
    details: 'Transaction ID: TXN-456, Error: Network timeout',
  },
  {
    id: 'LOG-005',
    timestamp: '2024-01-16T10:10:00Z',
    level: 'info',
    component: 'INVENTORY',
    message: 'Stock level updated',
    details: 'Product: iPhone 15 Case, New stock: 25 units',
  },
];

export default function SystemPage() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth>(mockSystemHealth);
  const [databaseMetrics, setDatabaseMetrics] = useState<DatabaseMetrics>(mockDatabaseMetrics);
  const [applicationMetrics, setApplicationMetrics] = useState<ApplicationMetrics>(mockApplicationMetrics);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics>(mockSecurityMetrics);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>(mockSystemLogs);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const loadSystemMetrics = async () => {
      setIsLoading(true);
      try {
        // In real app, fetch system metrics from API
        // const response = await ApiClient.request('/system/health');
        // setSystemHealth(response.data.health);
        // setDatabaseMetrics(response.data.database);
        // setApplicationMetrics(response.data.application);
        // setSecurityMetrics(response.data.security);
        // setSystemLogs(response.data.logs);
        
        // Using mock data for now
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error: any) {
        console.error('Failed to load system metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSystemMetrics();

    // Auto-refresh every 30 seconds if enabled
    if (autoRefresh) {
      const interval = setInterval(loadSystemMetrics, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
      case 'connected':
      case 'success':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'warning':
      case 'slow':
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'critical':
      case 'offline':
      case 'disconnected':
      case 'failed':
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'critical': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
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
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground">
            Monitor system health, performance, and security metrics
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="h-4 w-4 mr-2" />
            Auto Refresh: {autoRefresh ? 'On' : 'Off'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Status</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getStatusColor(systemHealth.status)}>
                    {systemHealth.status.toUpperCase()}
                  </Badge>
                  {systemHealth.status === 'healthy' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Uptime: {formatUptime(systemHealth.uptime)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Monitor className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">CPU Usage</p>
                <p className="text-2xl font-bold">{systemHealth.cpu.usage}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {systemHealth.cpu.cores} cores • {systemHealth.cpu.temperature}°C
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Cpu className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Memory Usage</p>
                <p className="text-2xl font-bold">{systemHealth.memory.percentage}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatBytes(systemHealth.memory.used * 1024 * 1024 * 1024)} / {formatBytes(systemHealth.memory.total * 1024 * 1024 * 1024)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Storage</p>
                <p className="text-2xl font-bold">{systemHealth.storage.percentage}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {systemHealth.storage.used}GB / {systemHealth.storage.total}GB
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <HardDrive className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Database Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Performance
            </CardTitle>
            <CardDescription>Database health and performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge className={getStatusColor(databaseMetrics.status)}>
                {databaseMetrics.status.toUpperCase()}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Active Connections</span>
                <span className="font-medium">
                  {databaseMetrics.connections.active}/{databaseMetrics.connections.max}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Query Performance</span>
                <span className="font-medium">{databaseMetrics.performance.queryTime}ms avg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Cache Hit Ratio</span>
                <span className="font-medium">{databaseMetrics.performance.cacheHitRatio}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Database Size</span>
                <span className="font-medium">{formatBytes(databaseMetrics.storage.size * 1024 * 1024 * 1024)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Last Backup</span>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(databaseMetrics.storage.backupStatus)} variant="outline">
                    {databaseMetrics.storage.backupStatus}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(databaseMetrics.storage.lastBackup).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Application Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Application Performance
            </CardTitle>
            <CardDescription>Application usage and performance statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{applicationMetrics.activeUsers}</p>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-green-600">{applicationMetrics.sessionsToday}</p>
                <p className="text-sm text-muted-foreground">Sessions Today</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Requests/Minute</span>
                <span className="font-medium">{applicationMetrics.requestsPerMinute}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Response Time</span>
                <span className="font-medium">{applicationMetrics.averageResponseTime}ms</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Error Rate</span>
                <span className="font-medium">{applicationMetrics.errorRate}%</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Feature Usage</h4>
              {applicationMetrics.featuresUsage.map((feature) => (
                <div key={feature.feature} className="flex items-center justify-between text-sm">
                  <span>{feature.feature}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{feature.usage}%</span>
                    {feature.trend === 'up' ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : feature.trend === 'down' ? (
                      <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />
                    ) : (
                      <Activity className="h-3 w-3 text-gray-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security & Network */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Security Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Status
            </CardTitle>
            <CardDescription>Security monitoring and threat detection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-xl font-bold text-green-600">{securityMetrics.loginAttempts.successful}</p>
                <p className="text-xs text-muted-foreground">Successful Logins</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-xl font-bold text-yellow-600">{securityMetrics.loginAttempts.failed}</p>
                <p className="text-xs text-muted-foreground">Failed Attempts</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-xl font-bold text-red-600">{securityMetrics.threats.blocked}</p>
                <p className="text-xs text-muted-foreground">Threats Blocked</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Threat Level</span>
                <Badge className={getStatusColor(securityMetrics.threats.level)}>
                  {securityMetrics.threats.level.toUpperCase()}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Audit Logs</span>
                <span className="font-medium">{securityMetrics.auditLogs.total} total</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Critical Events</span>
                <span className="font-medium">{securityMetrics.auditLogs.critical}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Last Security Scan</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(securityMetrics.lastSecurityScan).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Network Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Network Status
            </CardTitle>
            <CardDescription>Network connectivity and performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Connection Status</span>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(systemHealth.network.status)}>
                  {systemHealth.network.status.toUpperCase()}
                </Badge>
                <Wifi className="h-4 w-4 text-green-600" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Network Speed</span>
                <span className="font-medium">{systemHealth.network.speed} Mbps</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Latency</span>
                <span className="font-medium">{systemHealth.network.latency}ms</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Active Sessions</span>
                <span className="font-medium">{applicationMetrics.activeUsers}</span>
              </div>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4" />
                <span className="text-sm font-medium">Real-time Monitoring</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Requests/min: {applicationMetrics.requestsPerMinute}</div>
                <div>Response time: {applicationMetrics.averageResponseTime}ms</div>
                <div>Error rate: {applicationMetrics.errorRate}%</div>
                <div>Active users: {applicationMetrics.activeUsers}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Logs
          </CardTitle>
          <CardDescription>Recent system events and activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {systemLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="flex-shrink-0">
                  <Badge className={getLogLevelColor(log.level)} variant="outline">
                    {log.level}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{log.component}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm">{log.message}</p>
                  {log.details && (
                    <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
