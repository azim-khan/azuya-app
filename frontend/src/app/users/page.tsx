'use client';

import { useState, useEffect } from 'react';
import api from '@/services/api';
import { 
    Users, 
    UserPlus, 
    Pencil, 
    Trash2, 
    ShieldAlert, 
    UserCheck, 
    UserX, 
    KeyRound,
    Mail,
    User as UserIcon,
    Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isDisabled: boolean;
}

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [resettingUser, setResettingUser] = useState<User | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const { toast } = useToast();

    // Form states
    const [formData, setFormData] = useState({
        email: '',
        fullName: '',
        password: '',
        role: 'User'
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            toast({ title: 'Error', description: 'Failed to load users.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSaveUser = async () => {
        try {
            if (editingUser) {
                await api.put(`/users/${editingUser.id}`, formData);
                toast({ title: 'Success', description: 'User updated successfully.' });
            } else {
                await api.post('/users', formData);
                toast({ title: 'Success', description: 'User created successfully.' });
            }
            setIsDialogOpen(false);
            fetchUsers();
        } catch (error: any) {
            toast({ 
                title: 'Error', 
                description: error.response?.data?.message || 'Failed to save user.', 
                variant: 'destructive' 
            });
        }
    };

    const handleToggleStatus = async (user: User) => {
        try {
            await api.post(`/users/${user.id}/toggle-status`);
            toast({ 
                title: 'Success', 
                description: `User ${user.isDisabled ? 'enabled' : 'disabled'} successfully.` 
            });
            fetchUsers();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update user status.', variant: 'destructive' });
        }
    };

    const handleResetPassword = async () => {
        if (!resettingUser) return;
        try {
            await api.post(`/users/${resettingUser.id}/reset-password`, JSON.stringify(newPassword));
            toast({ title: 'Success', description: 'Password reset successfully.' });
            setIsResetPasswordDialogOpen(false);
            setNewPassword('');
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to reset password.', variant: 'destructive' });
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await api.delete(`/users/${id}`);
            toast({ title: 'Success', description: 'User deleted successfully.' });
            fetchUsers();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete user.', variant: 'destructive' });
        }
    };

    const columns: ColumnDef<User>[] = [
        { 
            accessorKey: 'fullName', 
            header: 'Full Name',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                        {row.original.fullName.charAt(0)}
                    </div>
                    <span className="font-medium">{row.original.fullName}</span>
                </div>
            )
        },
        { accessorKey: 'email', header: 'Email' },
        { 
            accessorKey: 'role', 
            header: 'Role',
            cell: ({ row }) => (
                <Badge variant={row.original.role === 'SuperAdmin' ? 'default' : 'secondary'} className="uppercase text-[10px] tracking-widest font-black">
                    {row.original.role}
                </Badge>
            )
        },
        { 
            accessorKey: 'isDisabled', 
            header: 'Status',
            cell: ({ row }) => (
                <Badge variant={row.original.isDisabled ? 'destructive' : 'outline'} className="flex w-fit items-center gap-1">
                    {row.original.isDisabled ? <UserX size={10} /> : <UserCheck size={10} />}
                    {row.original.isDisabled ? 'Disabled' : 'Active'}
                </Badge>
            )
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" title="Reset Password" onClick={() => {
                        setResettingUser(row.original);
                        setIsResetPasswordDialogOpen(true);
                    }}>
                        <KeyRound className="h-4 w-4 text-amber-500" />
                    </Button>
                    <Button variant="ghost" size="icon" title={row.original.isDisabled ? "Enable User" : "Disable User"} onClick={() => handleToggleStatus(row.original)}>
                        {row.original.isDisabled ? <UserCheck className="h-4 w-4 text-emerald-500" /> : <UserX className="h-4 w-4 text-red-500" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                        setEditingUser(row.original);
                        setFormData({
                            fullName: row.original.fullName,
                            email: row.original.email,
                            password: '',
                            role: row.original.role
                        });
                        setIsDialogOpen(true);
                    }}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteUser(row.original.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 flex flex-col h-full">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h2 className="text-2xl font-black tracking-tight uppercase italic flex items-center gap-3">
                        <Shield className="text-blue-600" /> User Management
                    </h2>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Control access levels and manage system users</p>
                </div>
                <Button onClick={() => {
                    setEditingUser(null);
                    setFormData({ email: '', fullName: '', password: '', role: 'User' });
                    setIsDialogOpen(true);
                }} className="bg-slate-900 hover:bg-black font-bold uppercase text-[11px] tracking-widest px-6 shadow-xl shadow-slate-200">
                    <UserPlus className="mr-2 h-4 w-4" /> Add New User
                </Button>
            </div>

            <div className="bg-white rounded-xl border shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
                <DataTable
                    columns={columns}
                    data={users}
                    loading={loading}
                />
            </div>

            {/* Create/Edit User Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="uppercase font-black italic">{editingUser ? 'Edit User' : 'Create User'}</DialogTitle>
                        <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            {editingUser ? 'Update account details for this user' : 'Register a new system user with specific roles'}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="text-[11px] font-black uppercase tracking-widest text-slate-600">Full Name</Label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input 
                                    id="fullName" 
                                    className="pl-10 h-11 border-slate-200 focus:ring-blue-500"
                                    value={formData.fullName} 
                                    onChange={(e) => setFormData({...formData, fullName: e.target.value})} 
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[11px] font-black uppercase tracking-widest text-slate-600">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input 
                                    id="email" 
                                    type="email"
                                    className="pl-10 h-11 border-slate-200 focus:ring-blue-500"
                                    value={formData.email} 
                                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                                />
                            </div>
                        </div>
                        {!editingUser && (
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-[11px] font-black uppercase tracking-widest text-slate-600">Password</Label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input 
                                        id="password" 
                                        type="password"
                                        className="pl-10 h-11 border-slate-200 focus:ring-blue-500"
                                        value={formData.password} 
                                        onChange={(e) => setFormData({...formData, password: e.target.value})} 
                                    />
                                </div>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-600">System Role</Label>
                            <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                                <SelectTrigger className="h-11 border-slate-200">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="User">User (Standard Access)</SelectItem>
                                    <SelectItem value="Admin">Admin (Stock & Transactions)</SelectItem>
                                    <SelectItem value="SuperAdmin">SuperAdmin (Full Control)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="uppercase font-bold text-[10px] tracking-widest">Cancel</Button>
                        <Button onClick={handleSaveUser} className="bg-slate-900 hover:bg-black uppercase font-bold text-[10px] tracking-widest px-8 shadow-lg shadow-slate-200">
                            {editingUser ? 'Update User' : 'Create User'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reset Password Dialog */}
            <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="uppercase font-black italic flex items-center gap-2">
                            <KeyRound size={20} className="text-amber-500" /> Reset Password
                        </DialogTitle>
                        <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Set a new temporary password for {resettingUser?.fullName}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-600">New Password</Label>
                            <Input 
                                type="password" 
                                className="h-11 border-slate-200 focus:ring-amber-500"
                                value={newPassword} 
                                onChange={(e) => setNewPassword(e.target.value)} 
                                placeholder="Enter strong password..."
                            />
                        </div>
                        <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg flex gap-3">
                            <ShieldAlert size={16} className="text-amber-600 shrink-0" />
                            <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase tracking-tighter">
                                Warning: This will immediately invalidate the user's current password.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)} className="uppercase font-bold text-[10px] tracking-widest">Cancel</Button>
                        <Button onClick={handleResetPassword} className="bg-amber-600 hover:bg-amber-700 uppercase font-bold text-[10px] tracking-widest px-8 shadow-lg shadow-amber-100">
                            Reset Now
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
