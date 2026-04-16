'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import InvoicePrinter from '@/components/sales/InvoicePrinter';

interface SaleDetailsProps {
    saleId: number | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function SaleDetailsDialog({ saleId, open, onOpenChange }: SaleDetailsProps) {
    const [sale, setSale] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [showInvoice, setShowInvoice] = useState(false);

    useEffect(() => {
        if (open && saleId) {
            fetchSaleDetails();
            setShowInvoice(false);
        }
    }, [open, saleId]);

    const handlePrint = () => {
        setShowInvoice(true);
        setTimeout(() => {
            window.print();
            setShowInvoice(false);
        }, 500);
    };

    const fetchSaleDetails = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/sales/${saleId}`);
            setSale(res.data);
        } catch (error) {
            console.error('Failed to fetch sale details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!saleId) return null;

    if (showInvoice && saleId) {
        return (
            <div className="space-y-6 max-h-[80vh] overflow-y-auto p-4 print:max-h-none print:overflow-visible">
                <InvoicePrinter saleId={saleId} />
            </div>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto print:max-h-none print:overflow-visible">
                <DialogHeader className="border-b pb-4 mb-4 pr-12">
                    <div className="flex justify-between items-start">
                        <div>
                            <DialogTitle className="text-2xl font-black text-slate-900">SALE DETAILS</DialogTitle>
                            <DialogDescription className="text-slate-500 font-mono">Invoice #{sale?.invoiceNo || '...'}</DialogDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handlePrint} className="border-slate-300">
                                <Printer className="h-4 w-4 mr-2" /> Print
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {loading ? (
                    <div className="h-64 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                    </div>
                ) : sale ? (
                    <div className="space-y-6">
                        {/* Customer & Info Grid */}
                        <div className="grid grid-cols-2 gap-8 bg-slate-50 p-6 rounded-xl">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Customer Info</p>
                                <p className="text-lg font-bold text-slate-900">{sale.customerName}</p>
                            </div>
                            <div className="text-right space-y-1">
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Transaction Date</p>
                                <p className="text-slate-900 font-medium">{format(new Date(sale.date), 'dd/MM/yyyy p')}</p>
                                <Badge variant={sale.paymentStatus === 'Paid' ? 'success' : 'warning'}>
                                    {sale.paymentStatus}
                                </Badge>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="border rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-widest border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Product</th>
                                        <th className="px-6 py-3 text-center">Qty</th>
                                        <th className="px-6 py-3 text-right">Price</th>
                                        <th className="px-6 py-3 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {sale.items.map((item: any, i: number) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900">{item.productName}</td>
                                            <td className="px-6 py-4 text-center text-slate-600">{item.quantity}</td>
                                            <td className="px-6 py-4 text-right text-slate-600">৳{item.unitPrice.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-900">৳{item.total.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Financial Summary */}
                        <div className="flex justify-end pr-6">
                            <div className="w-64 space-y-3">
                                <div className="flex justify-between text-sm text-slate-500">
                                    <span>Subtotal:</span>
                                    <span className="font-medium text-slate-900">৳{sale.subTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-500">
                                    <span>Discount:</span>
                                    <span className="font-medium text-rose-600">-৳{sale.discount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between pt-3 border-t-2 border-slate-900 text-lg font-black text-slate-900">
                                    <span>Total Amount:</span>
                                    <span>৳{sale.totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm text-emerald-600 font-bold bg-emerald-50 p-2 rounded">
                                    <span>Paid Amount:</span>
                                    <span>৳{sale.paidAmount.toLocaleString()}</span>
                                </div>
                                {sale.dueAmount > 0 && (
                                    <div className="flex justify-between text-sm text-rose-600 font-bold bg-rose-50 p-2 rounded">
                                        <span>Balance Due:</span>
                                        <span>৳{sale.dueAmount.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-12 text-center text-slate-400 italic">No sale data found.</div>
                )}
            </DialogContent>
        </Dialog>
    );
}
