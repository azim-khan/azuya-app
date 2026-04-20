'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Truck,
    Users,
    CreditCard,
    FileBarChart,
    Settings,
    ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import clsx from 'clsx';

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'Sales', href: '/sales', icon: ShoppingCart },
    { name: 'Purchases', href: '/purchases', icon: Truck },
    { name: 'Parties', href: '/parties', icon: Users },
    { name: 'Accounts', href: '/accounts', icon: CreditCard },
    { name: 'Reports', href: '/reports', icon: FileBarChart },
    { name: 'User Management', href: '/users', icon: ShieldCheck, superAdminOnly: true },
    { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user } = useAuth();

    const filteredNavItems = navItems.filter(item => {
        if (item.superAdminOnly && user?.role !== 'SuperAdmin') return false;
        return true;
    });

    return (
        <aside className="w-64 bg-slate-900 text-slate-300 h-screen fixed left-0 top-0 flex flex-col border-r border-slate-800">
            <div className="p-6 text-center">
                <h1 className="text-3xl font-black text-white tracking-tighter italic">AZU<span className="text-blue-500">YA</span></h1>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Inventory & Accounting Management</p>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {filteredNavItems.map((item) => {
                    const Icon = (item as any).icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                                isActive
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                                    : "hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <Icon size={20} className={clsx(isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
