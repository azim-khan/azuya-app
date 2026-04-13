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
    Settings
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'Sales', href: '/sales', icon: ShoppingCart },
    { name: 'Purchases', href: '/purchases', icon: Truck },
    { name: 'Parties', href: '/parties', icon: Users },
    { name: 'Accounts', href: '/accounts', icon: CreditCard },
    { name: 'Reports', href: '/reports', icon: FileBarChart },
    { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-slate-900 text-slate-300 h-screen fixed left-0 top-0 flex flex-col border-r border-slate-800">
            <div className="p-6">
                <h1 className="text-2xl font-bold text-white tracking-tight">Acct<span className="text-blue-500">Sys</span></h1>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
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
