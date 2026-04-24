'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import { Plus, Search, Loader2, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { PartyDialog } from '@/components/parties/PartyDialog';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';

import { useDataTable } from '@/hooks/use-data-table';

export default function Parties() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('customers');
    
    // Dialog state
    const [showDialog, setShowDialog] = useState(false);
    const [editingParty, setEditingParty] = useState<any>(null);

    // Use our new generic hook
    const {
        data: parties,
        loading,
        totalCount,
        pagination,
        setPagination,
        sorting,
        setSorting,
        refresh: fetchParties
    } = useDataTable<any>({
        endpoint: activeTab === 'customers' ? '/customers' : '/suppliers',
        initialPageSize: 10
    });

    const handleAdd = () => {
        setEditingParty(null);
        setShowDialog(true);
    };

    const handleEdit = (party: any) => {
        setEditingParty(party);
        setShowDialog(true);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm(`Are you sure you want to delete this ${activeTab.slice(0, -1)}?`)) return;

        try {
            const endpoint = activeTab === 'customers' ? '/customers' : '/suppliers';
            await api.delete(`${endpoint}/${id}`);
            toast({ title: 'Success', description: 'Deleted successfully' });
            fetchParties();
        } catch (error: any) {
            toast({
                title: 'Delete Failed',
                description: error.response?.data || 'Cannot delete because this party has associated records.',
                variant: 'destructive'
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Parties</h2>
                    <p className="text-muted-foreground">Manage your customers and suppliers.</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="customers">Customers</TabsTrigger>
                    <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
                </TabsList>

                {['customers', 'suppliers'].map((tab) => (
                    <TabsContent key={tab} value={tab} className="space-y-4">
                        <div className="flex justify-between items-center gap-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input type="search" placeholder={`Search ${tab}...`} className="pl-8" />
                            </div>
                            <Button onClick={handleAdd} className="capitalize">
                                <Plus className="mr-2 h-4 w-4" /> Add {tab.slice(0, -1)}
                            </Button>
                        </div>
                        <div className="rounded-md border">
                            <DataTable
                                columns={[
                                    { accessorKey: 'name', header: 'Name' },
                                    { accessorKey: 'phone', header: 'Phone' },
                                    { accessorKey: 'email', header: 'Email' },
                                    { accessorKey: 'address', header: 'Address', cell: ({ row }) => <span className="max-w-[200px] truncate block" title={row.original.address}>{row.original.address || '-'}</span> },
                                    {
                                        id: 'actions',
                                        header: () => <div className="text-right">Actions</div>,
                                        cell: ({ row }) => (
                                            <div className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(row.original.id)} className="text-rose-500 hover:text-rose-700 hover:bg-rose-50">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )
                                    }
                                ]}
                                data={parties}
                                loading={loading}
                                totalCount={totalCount}
                                pagination={pagination}
                                setPagination={setPagination}
                                sorting={sorting}
                                setSorting={setSorting}
                                manualSorting
                                manualPagination
                            />
                        </div>
                    </TabsContent>
                ))}
            </Tabs>

            <PartyDialog
                open={showDialog}
                onOpenChange={setShowDialog}
                type={activeTab === 'customers' ? 'customer' : 'supplier'}
                partyToEdit={editingParty}
                onSave={fetchParties}
            />
        </div>
    );
}
