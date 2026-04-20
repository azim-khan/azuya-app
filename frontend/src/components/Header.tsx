'use client';

import { User, Bell, Search, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
    const { user, logout } = useAuth();

    return (
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 sticky top-0 z-20">
            <div className="flex items-center gap-4 flex-1">
                <div className="hidden md:flex items-center gap-2 text-slate-400 bg-slate-50 px-3 py-1.5 rounded-md border text-sm w-64">
                    <Search size={16} />
                    <span>Quick find...</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="text-slate-500">
                    <Bell size={20} />
                </Button>
                
                <div className="h-8 w-[1px] bg-slate-200 mx-2" />
                
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-slate-900 leading-none">{user?.fullName || 'User'}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mt-1">{user?.role || 'Guest'}</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold shadow-md cursor-pointer hover:bg-black transition-colors uppercase">
                        {user?.fullName?.charAt(0) || 'U'}
                    </div>
                </div>

                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500" onClick={logout} title="Logout">
                    <LogOut size={18} />
                </Button>
            </div>
        </header>
    );
}
