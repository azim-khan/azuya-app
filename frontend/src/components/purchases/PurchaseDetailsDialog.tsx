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
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PurchaseDetailsProps {
    purchaseId: number | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function PurchaseDetailsDialog({ purchaseId, open, onOpenChange }: PurchaseDetailsProps) {
    const [purchase, setPurchase] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && purchaseId) {
            fetchPurchaseDetails();
        }
    }, [open, purchaseId]);

    const fetchPurchaseDetails = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/purchases/${purchaseId}`);
            setPurchase(res.data);
        } catch (error) {
            console.error('Failed to fetch purchase details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!purchaseId) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="border-b pb-4 mb-4">
                    <div>
                        <DialogTitle className="text-2xl font-black text-slate-900 uppercase">Purchase Details</DialogTitle>
                        <DialogDescription className="text-slate-500">Document No: <span className="text-slate-900 font-black uppercase">{purchase?.purchaseNo || 'N/A'}</span></DialogDescription>
                    </div>
                </DialogHeader>

                {loading ? (
                    <div className="h-64 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                    </div>
                ) : purchase ? (
                    <div className="space-y-6">
                        {/* Supplier & Info Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-100">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Supplier</p>
                                <p className="text-base font-bold text-slate-900">{purchase.supplierName}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Purchase Date</p>
                                <p className="text-slate-900 font-medium">{format(new Date(purchase.date), 'dd/MM/yyyy')}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Payment Status</p>
                                <p className={`font-black uppercase text-xs ${purchase.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-rose-600'}`}>{purchase.paymentStatus}</p>
                            </div>
                            <div className="text-right space-y-1">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Reference ID</p>
                                <p className="text-slate-400 font-mono text-xs">#{purchase.id}</p>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="border rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-100 text-[10px] uppercase font-black text-slate-600 tracking-widest border-b">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Product</th>
                                        <th className="px-6 py-4 text-center">Qty</th>
                                        <th className="px-6 py-4 text-right">Unit Cost</th>
                                        <th className="px-6 py-4 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {purchase.items.map((item: any, i: number) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-900">{item.productName}</td>
                                            <td className="px-6 py-4 text-center text-slate-600 font-medium">{item.quantity}</td>
                                            <td className="px-6 py-4 text-right text-slate-600">৳{item.unitCost.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right font-black text-slate-900">৳{item.total.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-50 border-t-2 border-slate-900">
                                    <tr className="border-b border-slate-200">
                                        <td colSpan={3} className="px-6 py-3 text-right font-bold text-slate-500 uppercase text-[10px] tracking-wider">Sub Total</td>
                                        <td className="px-6 py-3 text-right font-bold text-slate-900">৳{purchase.totalAmount.toLocaleString()}</td>
                                    </tr>
                                    <tr className="border-b border-slate-200">
                                        <td colSpan={3} className="px-6 py-3 text-right font-bold text-slate-500 uppercase text-[10px] tracking-wider">Paid Amount</td>
                                        <td className="px-6 py-3 text-right font-bold text-emerald-600">৳{purchase.paidAmount.toLocaleString()}</td>
                                    </tr>
                                    <tr className="bg-slate-900 text-white">
                                        <td colSpan={3} className="px-6 py-4 text-right font-black uppercase text-[10px] tracking-[0.2em]">Balance Due</td>
                                        <td className="px-6 py-4 text-right font-black text-xl text-emerald-400">৳{purchase.dueAmount.toLocaleString()}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <Button variant="outline" onClick={() => onOpenChange(false)} className="px-8 font-bold border-slate-900 text-slate-900">Close</Button>
                        </div>
                    </div>
                ) : (
                    <div className="p-12 text-center text-slate-400 italic font-medium">Record not found.</div>
                )}
            </DialogContent>
        </Dialog>
    );
}
