'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import { Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export default function PurchasesList() {
    const [purchases, setPurchases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPurchases();
    }, []);

    const fetchPurchases = async () => {
        try {
            const res = await api.get('/purchases');
            setPurchases(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Purchases</h2>
                    <p className="text-muted-foreground">Manage procurement and stock entry.</p>
                </div>
                <Link href="/purchases/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> New Purchase
                    </Button>
                </Link>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="animate-spin inline mr-2" /> Loading...</TableCell></TableRow>
                        ) : purchases.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center h-24">No purchases found.</TableCell></TableRow>
                        ) : (
                            purchases.map((purchase: any) => (
                                <TableRow key={purchase.id}>
                                    <TableCell>{new Date(purchase.date).toLocaleDateString()}</TableCell>
                                    <TableCell>{purchase.supplierName}</TableCell>
                                    <TableCell className="font-bold">${purchase.totalAmount.toFixed(2)}</TableCell>
                                    <TableCell>{purchase.items.length} items</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm">View</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
