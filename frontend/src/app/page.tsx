'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import {
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DashboardStats {
  totalSales: number;
  totalPurchases: number;
  productCount: number;
  lowStockCount: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/reports/dashboard');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="p-8 flex items-center justify-center"><Loader2 className="animate-spin mr-2" /> Loading dashboard...</div>;
  if (!stats) return <div className="p-8">Failed to load data.</div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-1">Overview of your business performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Sales"
          value={`$${stats.totalSales.toFixed(2)}`}
          icon={TrendingUp}
          description="Revenue from sales"
        />
        <StatCard
          title="Total Purchases"
          value={`$${stats.totalPurchases.toFixed(2)}`}
          icon={TrendingDown}
          description="Expenses on stock"
        />
        <StatCard
          title="Products"
          value={stats.productCount.toString()}
          icon={Package}
          description="Active items in inventory"
        />
        <StatCard
          title="Low Stock"
          value={stats.lowStockCount.toString()}
          icon={AlertTriangle}
          description="Items below reorder point"
          alert={stats.lowStockCount > 0}
        />
      </div>

      {/* Placeholder for Recent Activity or Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-[300px] flex items-center justify-center border-dashed">
          <p className="text-muted-foreground">Sales Chart Placeholder</p>
        </Card>
        <Card className="h-[300px] flex items-center justify-center border-dashed">
          <p className="text-muted-foreground">Recent Transactions Placeholder</p>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, description, alert }: any) {
  return (
    <Card className={alert ? "border-red-200 bg-red-50/50" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${alert ? 'text-red-500' : 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${alert ? 'text-red-600' : ''}`}>{value}</div>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
