'use client';

import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Plus, Search, Trash2, Eye, Pencil } from 'lucide-react';
import SaleDetailsDialog from '@/components/sales/SaleDetailsDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CustomDatePicker } from '@/components/ui/custom-date-picker';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
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
import SaleForm from '@/components/sales/SaleForm';

interface Sale {
    id: number;
    invoiceNo: string;
    date: string;
    customerId: number;
    customerName: string;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    paymentStatus: string;
}

import { useDataTable } from '@/hooks/use-data-table';

export default function SalesPage() {
    // Dialog and ID states
    const [saleToDelete, setSaleToDelete] = useState<number | null>(null);
    const [viewingSaleId, setViewingSaleId] = useState<number | null>(null);
    const [editingSaleId, setEditingSaleId] = useState<number | null>(null);
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
        data: sales,
        loading,
        totalCount,
        pagination,
        setPagination,
        sorting,
        setSorting,
        setFilters,
        refresh: fetchSales
    } = useDataTable<Sale>({
        endpoint: '/sales',
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

    const handleSaleSuccess = () => {
        setIsDialogOpen(false);
        fetchSales();
    };

    const handleDelete = async () => {
        if (!saleToDelete) return;
        try {
            await api.delete(`/sales/${saleToDelete}`);
            fetchSales();
            toast({ title: 'Success', description: 'Sale deleted and stock restored.' });
        } catch (error) {
            console.error('Delete failed:', error);
            toast({ title: 'Error', description: 'Could not delete sale.', variant: 'destructive' });
        } finally {
            setSaleToDelete(null);
        }
    };

    const columns: ColumnDef<Sale>[] = [
        {
            accessorKey: 'invoiceNo',
            header: 'Invoice #',
            cell: ({ row }) => <span className="font-mono">{row.getValue('invoiceNo')}</span>,
        },
        {
            accessorKey: 'date',
            header: 'Date',
            cell: ({ row }) => format(new Date(row.getValue('date')), 'dd/MM/yyyy p'),
        },
        {
            accessorKey: 'customerName',
            header: 'Customer',
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
                const status = row.original.paymentStatus;
                return (
                    <Badge variant={status === 'Paid' ? 'success' : status === 'Partial' ? 'warning' : 'destructive'}>
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
                            setViewingSaleId(row.original.id);
                            setIsViewDialogOpen(true);
                        }}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-900 hover:bg-slate-100"
                        title="Edit Sale"
                        onClick={() => {
                            setEditingSaleId(row.original.id);
                            setIsDialogOpen(true);
                        }}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => setSaleToDelete(row.original.id)}
                        title="Delete Sale"
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
                    <h2 className="text-2xl font-bold tracking-tight">Sales Management</h2>
                    <p className="text-muted-foreground">Manage your sales orders, invoices and payments.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) setEditingSaleId(null);
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-slate-900 hover:bg-black shadow-md text-white border-none" onClick={() => setEditingSaleId(null)}>
                            <Plus className="mr-2 h-4 w-4" /> New Sale
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[98vw] w-full h-[95vh] p-0 overflow-hidden border-none bg-transparent shadow-none">
                        <DialogTitle className="sr-only">{editingSaleId ? 'Edit Sale' : 'New Sale'}</DialogTitle>
                        <DialogDescription className="sr-only">Create or edit a sale transaction.</DialogDescription>
                        <div className="bg-white rounded-xl shadow-2xl border overflow-hidden h-full flex flex-col">
                            <SaleForm
                                saleId={editingSaleId}
                                onSuccess={handleSaleSuccess}
                                onCancel={() => setIsDialogOpen(false)}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* View Details Dialog */}
            <SaleDetailsDialog
                saleId={viewingSaleId}
                open={isViewDialogOpen}
                onOpenChange={setIsViewDialogOpen}
                onPrint={() => {
                    // We can reuse the print window logic or just close and click print
                    setIsViewDialogOpen(false);
                    // Add logic here if needed
                }}
            />

            <div className="flex flex-col md:flex-row items-end gap-4 bg-white p-4 rounded-lg border shadow-sm">
                <div className="relative w-1/2">
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Search</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Invoice # or Customer (Press Enter)..."
                            className="pl-10 h-10 border-slate-200 focus:ring-slate-900"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && setFilters(prev => ({ ...prev, search }))}
                        />
                    </div>
                </div>

                <div className="w-full md:w-auto">
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">From Date</label>
                    <CustomDatePicker
                        value={startDate}
                        onChange={setStartDate}
                    />
                </div>

                <div className="w-full md:w-auto">
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">To Date</label>
                    <CustomDatePicker
                        value={endDate}
                        onChange={setEndDate}
                    />
                </div>

                <div className="w-full md:w-auto">
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Status</label>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="h-10  border-slate-200 w-[120px]">
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
                    data={sales} 
                    loading={loading} 
                    sorting={sorting}
                    setSorting={setSorting}
                    manualSorting={true}
                    pagination={pagination}
                    setPagination={setPagination}
                    totalCount={totalCount}
                />
            </div>

            <AlertDialog open={saleToDelete !== null} onOpenChange={() => setSaleToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the sale record and restore the product stock. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700">
                            Delete Sale
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
