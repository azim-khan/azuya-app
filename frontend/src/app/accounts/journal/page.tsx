'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import { Loader2, BookOpen, Search, ArrowRightLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

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
    const [journal, setJournal] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchJournal = async () => {
            try {
                const res = await api.get('/accounts/journal');
                setJournal(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchJournal();
    }, []);

    const filteredJournal = journal.filter(j => 
        j.description.toLowerCase().includes(search.toLowerCase()) ||
        j.referenceNo.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-slate-400" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Journal Entries</h2>
                    <p className="text-slate-500 font-medium">Master log of all accounting transactions.</p>
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Search reference or desc..." 
                        className="pl-10" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-4">
                {filteredJournal.length === 0 ? (
                    <div className="text-center p-12 border-2 border-dashed rounded-xl text-slate-400">
                        No journal entries found matching your search.
                    </div>
                ) : filteredJournal.map((j) => (
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
        </div>
    );
}
