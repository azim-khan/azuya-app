'use client';

import { User, Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header() {
    return (
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 sticky top-0 z-20">
            <div className="flex items-center gap-4 flex-1">
                {/* Search in header if needed, but for now just a placeholder to balance layout */}
                <div className="hidden md:flex items-center gap-2 text-slate-400 bg-slate-50 px-3 py-1.5 rounded-md border text-sm w-64">
                    <Search size={16} />
                    <span>Search...</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="text-slate-500">
                    <Bell size={20} />
                </Button>
                
                <div className="h-8 w-[1px] bg-slate-200 mx-2" />
                
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-slate-900 leading-none">Admin User</p>
                        <p className="text-xs text-slate-500 mt-1">Administrator</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-200 cursor-pointer hover:bg-blue-700 transition-colors">
                        U
                    </div>
                </div>
            </div>
        </header>
    );
}
