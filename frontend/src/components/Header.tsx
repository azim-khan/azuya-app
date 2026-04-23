'use client';

import { useState } from 'react';
import { LogOut, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
    const { user, logout } = useAuth();
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { toast } = useToast();

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast({ title: 'Error', description: 'New passwords do not match.', variant: 'destructive' });
            return;
        }

        try {
            await api.post('/account/change-password', {
                currentPassword,
                newPassword
            });
            toast({ title: 'Success', description: 'Password changed successfully.' });
            setIsPasswordDialogOpen(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            let errorMsg = 'Failed to change password.';
            if (error.response?.data?.length > 0) {
                if (typeof error.response.data === 'string') {
                    errorMsg = error.response.data;
                } else if (error.response.data[0]?.description) {
                    errorMsg = error.response.data[0].description;
                }
            }
            toast({
                title: 'Error',
                description: errorMsg,
                variant: 'destructive'
            });
        }
    };

    return (
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 sticky top-0 z-20">
            <div className="flex items-center gap-3 flex-1">
                {process.env.NEXT_PUBLIC_APP_LOGO_URL && (
                    <img src={process.env.NEXT_PUBLIC_APP_LOGO_URL} alt="Logo" className="max-h-12 object-contain" />
                )}
                <div>
                    <h1 className="text-xl font-black tracking-tighter uppercase leading-none">{process.env.NEXT_PUBLIC_APP_NAME}</h1>
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] mt-1">Inventory & Accounting Management</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="h-8 w-[1px] bg-slate-200 mx-2" />

                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-slate-900 leading-none">{user?.fullName || 'User'}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mt-1">{user?.role || 'Guest'}</p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold shadow-md cursor-pointer hover:bg-black transition-colors uppercase outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                                {user?.fullName?.charAt(0) || 'U'}
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 mt-2">
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user?.fullName || 'User'}</p>
                                    <p className="text-xs leading-none text-slate-500">
                                        {user?.username}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setIsPasswordDialogOpen(true)} className="cursor-pointer">
                                <KeyRound className="mr-2 h-4 w-4 text-blue-500" />
                                <span>Change Password</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold leading-none tracking-tight uppercase">
                            Change Password
                        </DialogTitle>
                        <DialogDescription className="text-[10px] uppercase tracking-widest text-slate-400">
                            Update your account password
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-600">Current Password</Label>
                            <Input
                                type="password"
                                className="h-11 border-slate-200"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                autoComplete="new-password"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-600">New Password</Label>
                            <Input
                                type="password"
                                className="h-11 border-slate-200"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                autoComplete="new-password"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-600">Confirm Password</Label>
                            <Input
                                type="password"
                                className="h-11 border-slate-200"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                autoComplete="new-password"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)} className="uppercase font-bold text-[10px] tracking-widest">Cancel</Button>
                        <Button onClick={handleChangePassword} className="bg-blue-600 hover:bg-blue-700 uppercase font-bold text-[10px] tracking-widest px-8 shadow-lg shadow-blue-100">
                            Change Password
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </header>
    );
}
