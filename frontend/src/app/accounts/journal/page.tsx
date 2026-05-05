'use client';

import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Loader2, Search, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { CustomDatePicker } from '@/components/ui/custom-date-picker';
import { useDataTable } from '@/hooks/use-data-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface JournalEntry {
    id: number;
    date: string;
    description: string;
    referenceNo: string;
    sourceType: string;
    entries: {
        id: number;
        account: { name: string };
        debit: number;
        credit: number;
    }[];
}

export default function Journal() {
    const router = useRouter();

    // Filters state
    const [searchValue, setSearchValue] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [accountId, setAccountId] = useState<string>('all');
    const [accounts, setAccounts] = useState<any[]>([]);

    useEffect(() => {
        api.get('/accounts?pageSize=1000').then(res => {
            setAccounts(res.data?.data || res.data || []);
        });
    }, []);

    const {
        data: journal,
        loading,
        totalCount,
        pagination,
        setPagination,
        filters,
        updateFilter,
        setFilters
    } = useDataTable<JournalEntry>({
        endpoint: '/accounts/journal',
        initialFilters: {
            search: '',
            startDate: '',
            endDate: '',
            accountId: ''
        }
    });

    const totalPages = Math.ceil(totalCount / pagination.pageSize);
    const currentPage = pagination.pageIndex + 1;

    // Sync filters when values change
    useEffect(() => {
        setFilters(prev => ({
            ...prev,
            startDate,
            endDate,
            accountId: accountId === 'all' ? '' : accountId
        }));
    }, [startDate, endDate, accountId, setFilters]);

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            updateFilter('search', searchValue);
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Journal Entries</h2>
                        <p className="text-slate-500 font-medium">Master log of all accounting transactions.</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-end gap-4 bg-white p-4 rounded-md border shadow-sm">
                <div className="relative flex-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Search</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search reference or desc (Press Enter)..."
                            className="pl-10 h-10"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                        />
                    </div>
                </div>

                <div className="w-full md:w-auto">
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">From Date</label>
                    <CustomDatePicker value={startDate} onChange={setStartDate} />
                </div>

                <div className="w-full md:w-auto">
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">To Date</label>
                    <CustomDatePicker value={endDate} onChange={setEndDate} />
                </div>

                <div className="w-full md:w-64">
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Account</label>
                    <Select value={accountId} onValueChange={setAccountId}>
                        <SelectTrigger className="h-10">
                            <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {accounts.map(acc => (
                                <SelectItem key={acc.id} value={acc.id.toString()}>{acc.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Button
                    variant="ghost"
                    className="h-10 text-slate-500"
                    onClick={() => {
                        setSearchValue('');
                        setStartDate('');
                        setEndDate('');
                        setAccountId('all');
                        setFilters({ search: '', startDate: '', endDate: '', accountId: '' });
                    }}
                >
                    Clear
                </Button>
            </div>

            <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-slate-400" /></div>
                ) : journal.length === 0 ? (
                    <div className="text-center p-12 border-2 border-dashed rounded-xl text-slate-400">
                        No journal entries found matching your criteria.
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-auto">
                            {journal.map((j) => (
                                <Card key={j.id} className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-all">
                                    <div className="bg-slate-50 px-6 py-3 border-b flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                {format(new Date(j.date), 'dd/MM/yyyy p')}
                                            </span>
                                            <Badge variant="outline" className="font-mono text-[10px] bg-white">
                                                {j.referenceNo}
                                            </Badge>
                                            <Badge variant="secondary" className="text-[10px] uppercase font-black tracking-tight">
                                                {j.sourceType}
                                            </Badge>
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-900">{j.description}</h4>
                                    </div>
                                    <div className="px-6 py-4">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-[10px] uppercase text-slate-400 font-bold tracking-widest border-b">
                                                    <th className="text-left pb-2">Account</th>
                                                    <th className="text-right pb-2">Debit</th>
                                                    <th className="text-right pb-2 pr-4">Credit</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {j.entries.map((e) => (
                                                    <tr key={e.id}>
                                                        <td className="py-2 font-medium text-slate-700">
                                                            {e.credit > 0 ? <span className="ml-8">{e.account.name}</span> : e.account.name}
                                                        </td>
                                                        <td className="py-2 text-right font-mono">
                                                            {e.debit > 0 ? `৳${e.debit.toLocaleString()}` : ''}
                                                        </td>
                                                        <td className="py-2 text-right font-mono pr-4">
                                                            {e.credit > 0 ? `৳${e.credit.toLocaleString()}` : ''}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="border-t font-bold bg-slate-50/50">
                                                    <td className="py-2 px-2 text-slate-500 uppercase text-[10px]">Total</td>
                                                    <td className="py-2 text-right font-mono">
                                                        ৳{j.entries.reduce((sum, e) => sum + e.debit, 0).toLocaleString()}
                                                    </td>
                                                    <td className="py-2 text-right font-mono pr-4">
                                                        ৳{j.entries.reduce((sum, e) => sum + e.credit, 0).toLocaleString()}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </Card>
                            ))}
                        </div>
                        <div className="flex items-center justify-between pt-4">
                            <p className="text-xs text-muted-foreground">
                                Showing {journal.length} of {totalCount} entries
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
                    </>
                )}
            </div>
        </div>
    );
}
