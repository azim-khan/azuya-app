'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import { CreditCard, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { AccountDialog } from '@/components/accounts/AccountDialog';

export default function Accounts() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Dialog state
    const [showDialog, setShowDialog] = useState(false);
    const [editingAccount, setEditingAccount] = useState<any>(null);

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const res = await api.get('/accounts');
            setAccounts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingAccount(null);
        setShowDialog(true);
    };

    const handleEdit = (acc: any) => {
        setEditingAccount(acc);
        setShowDialog(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Accounts</h2>
                    <p className="text-muted-foreground">Chart of accounts and ledgers.</p>
                </div>
                <Button onClick={handleAdd}>
                    <Plus className="mr-2 h-4 w-4" /> New Account
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
            ) : accounts.length === 0 ? (
                <div className="text-center p-8 border rounded-lg bg-slate-50 text-slate-500">
                    No accounts found. Create one to get started.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {accounts.map((acc: any) => (
                        <Card key={acc.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleEdit(acc)}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {acc.name}
                                </CardTitle>
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${acc.balance.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground">
                                    {acc.type}
                                </p>
                            </CardContent>
                            <CardFooter className="pt-0">
                                <Button variant="link" className="px-0 h-auto text-xs" onClick={(e) => { e.stopPropagation(); /* Nav to ledger */ }}>
                                    View Ledger
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            <AccountDialog
                open={showDialog}
                onOpenChange={setShowDialog}
                accountToEdit={editingAccount}
                onSave={fetchAccounts}
            />
        </div>
    );
}
