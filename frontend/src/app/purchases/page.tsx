'use client';

import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Plus, Search, Trash2, Eye, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import PurchaseDetailsDialog from '@/components/purchases/PurchaseDetailsDialog';
import PurchaseForm from '@/components/purchases/PurchaseForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CustomDatePicker } from '@/components/ui/custom-date-picker';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Purchase {
    id: number;
    purchaseNo: string;
    date: string;
    supplierId: number;
    supplierName: string;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    paymentStatus: string;
    items?: any[];
}

import { useDataTable } from '@/hooks/use-data-table';

export default function PurchasesPage() {
    // Dialog and ID states
    const [purchaseToDelete, setPurchaseToDelete] = useState<number | null>(null);
    const [viewingPurchaseId, setViewingPurchaseId] = useState<number | null>(null);
    const [editingPurchaseId, setEditingPurchaseId] = useState<number | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

    // Filters (Local state for inputs)
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [status, setStatus] = useState('All');

    const { toast } = useToast();

    // Use our new generic hook
    const {
        data: purchases,
        loading,
        totalCount,
        pagination,
        setPagination,
        sorting,
        setSorting,
        setFilters,
        refresh: fetchPurchases
    } = useDataTable<Purchase>({
        endpoint: '/purchases',
        initialFilters: {
            search: '',
            startDate: '',
            endDate: '',
            status: 'All'
        }
    });

    // Update filters in the hook when local filter states change
    useEffect(() => {
        setFilters({ search, startDate, endDate, status });
    }, [startDate, endDate, status, setFilters]); // search is triggered by Enter, so not here

    const handlePurchaseSuccess = () => {
        setIsDialogOpen(false);
        fetchPurchases();
    };

    const handleDelete = async () => {
        if (!purchaseToDelete) return;
        try {
            await api.delete(`/purchases/${purchaseToDelete}`);
            fetchPurchases();
            toast({ title: 'Success', description: 'Purchase deleted and stock adjusted.' });
        } catch (error) {
            console.error('Delete failed:', error);
            toast({ title: 'Error', description: 'Could not delete purchase record.', variant: 'destructive' });
        } finally {
            setPurchaseToDelete(null);
        }
    };

    const columns: ColumnDef<Purchase>[] = [
        {
            accessorKey: 'purchaseNo',
            header: 'Purchase #',
            cell: ({ row }) => <span className="font-mono">{row.getValue('purchaseNo')}</span>,
        },
        {
            accessorKey: 'date',
            header: 'Date',
            cell: ({ row }) => format(new Date(row.getValue('date')), 'dd/MM/yyyy p'),
        },
        {
            accessorKey: 'supplierName',
            header: 'Supplier',
        },
        {
            accessorKey: 'totalAmount',
            header: 'Total',
            cell: ({ row }) => <span className="font-semibold text-slate-900">৳{row.original.totalAmount.toLocaleString()}</span>,
        },
        {
            accessorKey: 'paidAmount',
            header: 'Paid',
            cell: ({ row }) => <span className="text-emerald-600">৳{row.original.paidAmount.toLocaleString()}</span>,
        },
        {
            accessorKey: 'dueAmount',
            header: 'Due',
            cell: ({ row }) => (
                <span className={row.original.dueAmount > 0 ? "text-rose-600 font-medium" : "text-slate-400"}>
                    ৳{row.original.dueAmount.toLocaleString()}
                </span>
            ),
        },
        {
            accessorKey: 'paymentStatus',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.getValue('paymentStatus') as string;
                return (
                    <Badge variant={
                        status === 'Paid' ? 'success' :
                            status === 'Partial' ? 'warning' : 'destructive'
                    } className="font-bold uppercase text-[10px] tracking-widest">
                        {status}
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex gap-2 justify-end">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-slate-100 text-slate-600"
                        title="View Details"
                        onClick={() => {
                            setViewingPurchaseId(row.original.id);
                            setIsViewDialogOpen(true);
                        }}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-900 hover:bg-slate-100"
                        title="Edit Purchase"
                        onClick={() => {
                            setEditingPurchaseId(row.original.id);
                            setIsDialogOpen(true);
                        }}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => setPurchaseToDelete(row.original.id)}
                        title="Delete Purchase"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];



    return (
        <div className="space-y-6 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Purchase Management</h2>
                    <p className="text-slate-500 font-medium">Manage procurement records and inventory entry.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) setEditingPurchaseId(null);
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-slate-900 hover:bg-black shadow-md text-white border-none font-bold" onClick={() => setEditingPurchaseId(null)}>
                            <Plus className="mr-2 h-4 w-4" /> New Purchase
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[98vw] w-full h-[95vh] p-0 overflow-hidden border-none bg-transparent shadow-none">
                        <DialogTitle className="sr-only">{editingPurchaseId ? 'Edit Purchase' : 'New Purchase'}</DialogTitle>
                        <DialogDescription className="sr-only">Record or edit a purchase transaction from a supplier.</DialogDescription>
                        <div className="bg-white rounded-xl shadow-2xl border overflow-hidden h-full flex flex-col">
                            <PurchaseForm
                                purchaseId={editingPurchaseId}
                                onSuccess={handlePurchaseSuccess}
                                onCancel={() => setIsDialogOpen(false)}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* View Details Dialog */}
            <PurchaseDetailsDialog
                purchaseId={viewingPurchaseId}
                open={isViewDialogOpen}
                onOpenChange={setIsViewDialogOpen}
            />

            <div className="flex flex-col md:flex-row items-end gap-4 bg-white p-4 rounded-xl border shadow-sm">
                <div className="relative w-1/2">
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Search</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="ID or Supplier (Press Enter)..."
                            className="pl-10 h-10 border-slate-200 focus:ring-slate-900"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && setFilters(prev => ({ ...prev, search }))}
                        />
                    </div>
                </div>

                <div className="w-full md:w-auto relative">
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">From Date</label>
                    <CustomDatePicker
                        value={startDate}
                        onChange={setStartDate}
                    />
                </div>

                <div className="w-full md:w-auto relative">
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">To Date</label>
                    <CustomDatePicker
                        value={endDate}
                        onChange={setEndDate}
                    />
                </div>

                <div className="w-full md:w-auto">
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Status</label>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="h-10 border-slate-200 w-[120px]">
                            <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All</SelectItem>
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="Partial">Partial</SelectItem>
                            <SelectItem value="Due">Due</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button
                    variant="ghost"
                    className="text-slate-500 hover:text-slate-900 h-10 px-3"
                    onClick={() => {
                        setStartDate('');
                        setEndDate('');
                        setSearch('');
                        setStatus('All');
                        setFilters({ search: '', startDate: '', endDate: '', status: 'All' });
                    }}
                >
                    Clear
                </Button>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <DataTable 
                    columns={columns} 
                    data={purchases} 
                    loading={loading} 
                    sorting={sorting}
                    setSorting={setSorting}
                    manualSorting={true}
                    pagination={pagination}
                    setPagination={setPagination}
                    totalCount={totalCount}
                />
            </div>

            <AlertDialog open={purchaseToDelete !== null} onOpenChange={() => setPurchaseToDelete(null)}>
                <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black text-slate-900 uppercase tracking-tight">Confirm Deletion</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-600 font-medium py-2">
                            This will permanently delete this purchase record and **reduce** the product stock count accordingly. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="font-bold border-slate-200">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700 font-black uppercase tracking-widest text-white shadow-lg shadow-rose-100">
                            Delete Record
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
