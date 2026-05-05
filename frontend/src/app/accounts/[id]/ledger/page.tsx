'use client';

import { useEffect, useState, use } from 'react';
import api from '@/services/api';
import { Loader2, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { CustomDatePicker } from '@/components/ui/custom-date-picker';
import { useDataTable } from '@/hooks/use-data-table';

interface LedgerEntry {
    id: number;
    journalEntry: {
        date: string;
        description: string;
        referenceNo: string;
        sourceType: string;
    };
    debit: number;
    credit: number;
}

export default function AccountLedger({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [account, setAccount] = useState<any>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const {
        data: entries,
        loading,
        totalCount,
        pagination,
        setPagination,
        setFilters
    } = useDataTable<LedgerEntry>({
        endpoint: `/accounts/${id}/ledger`,
        initialFilters: {
            startDate: '',
            endDate: ''
        }
    });

    useEffect(() => {
        const fetchAccount = async () => {
            try {
                const res = await api.get('/accounts?pageSize=1000');
                const accountList = res.data?.data || res.data || [];
                const currentAcc = accountList.find((a: any) => a.id === parseInt(id));
                setAccount(currentAcc);
            } catch (err) {
                console.error(err);
            }
        };
        fetchAccount();
    }, [id]);

    useEffect(() => {
        setFilters(prev => ({ ...prev, startDate, endDate }));
    }, [startDate, endDate, setFilters]);

    const totalPages = Math.ceil(totalCount / pagination.pageSize);
    const currentPage = pagination.pageIndex + 1;

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">{account?.name} Ledger</h2>
                        <p className="text-slate-500 font-medium text-xs">Transaction history and balance tracking.</p>
                    </div>
                </div>

                <Card className="bg-slate-900 text-white border-none shadow-md px-6 py-3 flex items-center gap-6">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Balance</p>
                        <div className="text-xl font-black text-emerald-400">৳{account?.balance?.toLocaleString() || 0}</div>
                    </div>
                    <div className="w-px h-8 bg-slate-800" />
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Type</p>
                        <div className="text-xs font-bold text-slate-300 uppercase">{account?.type}</div>
                    </div>
                </Card>
            </div>

            <div className="flex flex-col md:flex-row items-end gap-4 bg-white p-4 rounded-md border shadow-sm">
                <div className="w-full md:w-auto">
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">From Date</label>
                    <CustomDatePicker value={startDate} onChange={setStartDate} />
                </div>

                <div className="w-full md:w-auto">
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">To Date</label>
                    <CustomDatePicker value={endDate} onChange={setEndDate} />
                </div>

                <Button
                    variant="ghost"
                    className="h-10 text-slate-500"
                    onClick={() => {
                        setStartDate('');
                        setEndDate('');
                    }}
                >
                    Clear
                </Button>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 rounded-md border bg-card">
                    <div className="overflow-auto h-full">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b text-[10px] uppercase font-bold text-slate-500 tracking-wider sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4 text-left">Date</th>
                                    <th className="px-6 py-4 text-left">Description</th>
                                    <th className="px-6 py-4 text-left">Reference</th>
                                    <th className="px-6 py-4 text-right">Debit</th>
                                    <th className="px-6 py-4 text-right">Credit</th>
                                    <th className="px-6 py-4 text-right pr-10">Source</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    <tr><td colSpan={6} className="py-12 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-slate-400" /></td></tr>
                                ) : entries.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">No transactions found for this account.</td>
                                    </tr>
                                ) : entries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                            {format(new Date(entry.journalEntry.date), 'dd/MM/yyyy')}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {entry.journalEntry.description}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className="font-mono text-[10px]">
                                                {entry.journalEntry.referenceNo}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-emerald-600">
                                            {entry.debit > 0 ? `৳${entry.debit.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-rose-600">
                                            {entry.credit > 0 ? `৳${entry.credit.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right pr-10">
                                            <Badge variant="secondary" className="text-[10px] uppercase font-black">
                                                {entry.journalEntry.sourceType}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50/50">
                    <p className="text-xs text-muted-foreground">
                        Showing {entries.length} of {totalCount} entries
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1 || loading}
                            onClick={() => setPagination(prev => ({ ...prev, pageIndex: prev.pageIndex - 1 }))}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage >= totalPages || loading}
                            onClick={() => setPagination(prev => ({ ...prev, pageIndex: prev.pageIndex + 1 }))}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
