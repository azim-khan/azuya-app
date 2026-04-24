'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import { CreditCard, Plus, Loader2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { AccountDialog } from '@/components/accounts/AccountDialog';
import { useRouter } from 'next/navigation';

import { useDataTable } from '@/hooks/use-data-table';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function Accounts() {
    const router = useRouter();
    const { 
        data: accounts, 
        loading, 
        totalCount,
        pagination, 
        setPagination,
        filters, 
        updateFilter, 
        refresh 
    } = useDataTable({ endpoint: '/accounts' });

    // Calculate pagination info for display
    const totalPages = Math.ceil(totalCount / pagination.pageSize);
    const currentPage = pagination.pageIndex + 1;

    // Dialog state
    const [showDialog, setShowDialog] = useState(false);
    const [editingAccount, setEditingAccount] = useState<any>(null);

    const handleAdd = () => {
        setEditingAccount(null);
        setShowDialog(true);
    };

    const handleEdit = (acc: any) => {
        setEditingAccount(acc);
        setShowDialog(true);
    };

    // Local search state to trigger on Enter
    const [searchValue, setSearchValue] = useState(filters.search || '');

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            updateFilter('search', searchValue);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Accounts</h2>
                    <p className="text-muted-foreground">Chart of accounts and ledgers.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push('/accounts/journal')}>
                        <BookOpen className="mr-2 h-4 w-4" /> View Journal
                    </Button>
                    <Button onClick={handleAdd}>
                        <Plus className="mr-2 h-4 w-4" /> New Account
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search accounts (Press Enter)..."
                        className="pl-10"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                    />
                </div>
                {filters.search && (
                    <Button variant="ghost" size="sm" onClick={() => {
                        setSearchValue('');
                        updateFilter('search', '');
                    }}>
                        Clear
                    </Button>
                )}
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                            <tr>
                                <th className="px-6 py-4 text-left">Account Name</th>
                                <th className="px-6 py-4 text-left">Type</th>
                                <th className="px-6 py-4 text-right">Balance</th>
                                <th className="px-6 py-4 text-right pr-10">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr><td colSpan={4} className="py-12 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" /></td></tr>
                            ) : accounts.length === 0 ? (
                                <tr><td colSpan={4} className="py-12 text-center text-slate-500">No accounts found.</td></tr>
                            ) : accounts.map((acc: any) => (
                                <tr key={acc.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => handleEdit(acc)}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 rounded-lg">
                                                <CreditCard className="h-4 w-4 text-slate-600" />
                                            </div>
                                            <span className="font-bold text-slate-900">{acc.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant="secondary" className="uppercase text-[10px] font-black">
                                            {acc.type}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right font-black text-slate-900">
                                        ৳{acc.balance.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right pr-10">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                router.push(`/accounts/${acc.id}/ledger`);
                                            }}
                                        >
                                            View Ledger
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                    Showing {accounts.length} of {totalCount} accounts
                </p>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setPagination(prev => ({ ...prev, pageIndex: prev.pageIndex - 1 }))}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= totalPages}
                        onClick={() => setPagination(prev => ({ ...prev, pageIndex: prev.pageIndex + 1 }))}
                    >
                        Next
                    </Button>
                </div>
            </div>

            <AccountDialog
                open={showDialog}
                onOpenChange={setShowDialog}
                accountToEdit={editingAccount}
                onSave={refresh}
            />
        </div>
    );
}
