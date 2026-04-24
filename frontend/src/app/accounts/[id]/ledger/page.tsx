'use client';

import { useEffect, useState, use } from 'react';
import api from '@/services/api';
import { Loader2, ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

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
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [account, setAccount] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ledgerRes, accRes] = await Promise.all([
                    api.get(`/accounts/${id}/ledger`),
                    api.get('/accounts?pageSize=1000')
                ]);
                setEntries(ledgerRes.data);
                const accountList = accRes.data?.data || accRes.data || [];
                const currentAcc = accountList.find((a: any) => a.id === parseInt(id));
                setAccount(currentAcc);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-slate-400" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">{account?.name} Ledger</h2>
                        <p className="text-slate-500 font-medium">Transaction history and balance tracking.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-slate-900 text-white border-none shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">Current Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">৳{account?.balance?.toLocaleString() || 0}</div>
                        <p className="text-xs text-slate-500 mt-1 uppercase font-bold">{account?.type}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                            <tr>
                                <th className="px-6 py-4 text-left">Date</th>
                                <th className="px-6 py-4 text-left">Description</th>
                                <th className="px-6 py-4 text-left">Reference</th>
                                <th className="px-6 py-4 text-right">Debit</th>
                                <th className="px-6 py-4 text-right">Credit</th>
                                <th className="px-6 py-4 text-right pr-10">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {entries.length === 0 ? (
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
            </Card>
        </div>
    );
}
