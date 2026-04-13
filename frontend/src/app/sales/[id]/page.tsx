'use client';

// Note: Next.js App Router dynamic params are passed as props to the component.
// But since this is a client component for easy printing, we'll wrap it or just use simple fetching.
// Actually, App Router Page component receives { params }: { params: { id: string } }
// We can use that.

import { useEffect, useState } from 'react';
import api from '@/services/api';
import { useParams } from 'next/navigation';

export default function InvoicePage({ params }: { params: { id: string } }) {
    const [sale, setSale] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    // useParams() can also be used if params props are tricky in some setups, but props are standard.
    // We'll trust params prop if provided by Next.js layout, explicitly passed.
    // Wait, in Next.js 13+ App Router, the page component receives params as a prop.

    // Actually, let's use the hook for safety in client component.
    const routeParams = useParams();
    const id = routeParams?.id || params?.id;

    useEffect(() => {
        if (id) fetchSale(id as string);
    }, [id]);

    const fetchSale = async (saleId: string) => {
        try {
            // Need an endpoint for Single Sale. Our GetSales returned all.
            // We need to implement GetSale(id) in backend or filter from list (inefficient but works for now if API missing).
            // Wait, SalesController has GetSales() but NO GetSale(id). I missed it!
            // I only implemented GetSales() (List) and CreateSale().
            // I need to add GetSale(id) to backend SalesController.
            // Or I can add a temporary fix to fetch all and filter in frontend (BAD).
            // I should FIX the backend.

            // Let's assume I fix backend. I'll add GetSale(id) to SalesController in the next step.
            const res = await api.get(`/sales/${saleId}`);
            setSale(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-12 text-center">Loading Invoice...</div>;
    if (!sale) return <div className="p-12 text-center">Invoice not found.</div>;

    return (
        <div className="bg-white min-h-screen p-8 text-slate-800">
            <div className="max-w-3xl mx-auto border border-slate-200 p-8 shadow-sm print:shadow-none print:border-none">

                {/* Header */}
                <div className="flex justify-between items-start mb-12">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">INVOICE</h1>
                        <p className="text-slate-500 font-medium">#{sale.invoiceNo}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="font-bold text-xl mb-1">AcctSys Inc.</h2>
                        <p className="text-sm text-slate-500">123 Business Rd, Tech City</p>
                        <p className="text-sm text-slate-500">support@acctsys.com</p>
                    </div>
                </div>

                {/* Details */}
                <div className="flex justify-between mb-8 pb-8 border-b border-slate-100">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Bill To</p>
                        <p className="font-bold text-lg">{sale.customerName}</p>
                        {/* Customer Address if available in DTO. We didn't include it in SaleDto, only Name. */}
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Date</p>
                        <p className="font-medium">{new Date(sale.date).toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Items */}
                <table className="w-full mb-8">
                    <thead>
                        <tr className="text-left border-b border-slate-200">
                            <th className="pb-3 font-semibold text-sm">Item</th>
                            <th className="pb-3 font-semibold text-sm text-center">Qty</th>
                            <th className="pb-3 font-semibold text-sm text-right">Price</th>
                            <th className="pb-3 font-semibold text-sm text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sale.items.map((item: any) => (
                            <tr key={item.productId} className="border-b border-slate-50">
                                <td className="py-3">{item.productName}</td>
                                <td className="py-3 text-center">{item.quantity}</td>
                                <td className="py-3 text-right">${item.unitPrice.toFixed(2)}</td>
                                <td className="py-3 text-right font-medium">${item.total.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-12">
                    <div className="w-64 space-y-2">
                        <div className="flex justify-between border-t border-slate-200 pt-2">
                            <span className="font-bold text-lg">Total</span>
                            <span className="font-bold text-lg text-blue-600">${sale.totalAmount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-sm text-slate-400 mt-12 pt-8 border-t border-slate-100">
                    <p>Thank you for your business!</p>
                </div>

            </div>

            <div className="text-center mt-8 print:hidden">
                <button onClick={() => window.print()} className="btn btn-primary">Print Invoice</button>
            </div>
        </div>
    );
}
