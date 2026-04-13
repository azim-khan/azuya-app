'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import { Mail, Phone, Globe, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface InvoiceData {
    invoiceNo: string;
    date: string;
    customerName: string;
    subTotal: number;
    discount: number;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    paymentStatus: string;
    items: {
        productName: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }[];
}

interface CompanyInfo {
    name: string;
    tagline: string;
    logo: string;
    address: string;
    mobile: string;
    website: string;
    email: string;
    currencySymbol: string;
}

export default function InvoicePrinter({ saleId }: { saleId: number | string }) {
    const [sale, setSale] = useState<InvoiceData | null>(null);
    const [company, setCompany] = useState<CompanyInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [saleRes, companyRes] = await Promise.all([
                    api.get(`/sales/${saleId}`),
                    api.get('/companyinfo')
                ]);
                setSale(saleRes.data);
                setCompany(companyRes.data);
            } catch (error) {
                console.error('Failed to load invoice data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [saleId]);

    if (loading) return <div className="p-8 text-center text-slate-500">Generating Invoice...</div>;
    if (!sale || !company) return <div className="p-8 text-center text-rose-500">Error loading invoice.</div>;

    return (
        <div className="bg-white p-8 max-w-[800px] mx-auto print:p-0 print:m-0" id="printable-invoice">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 border-b pb-8">
                <div className="flex gap-4 items-center">
                    {company.logo && (
                        <img src={company.logo} alt="Logo" className="w-20 h-20 object-contain rounded" />
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{company.name}</h1>
                        <p className="text-slate-500 text-sm italic">{company.tagline}</p>
                    </div>
                </div>
                <div className="text-right space-y-1 text-slate-500 text-sm">
                    <div className="flex items-center justify-end gap-2"><MapPin size={12}/> {company.address}</div>
                    <div className="flex items-center justify-end gap-2"><Phone size={12}/> {company.mobile}</div>
                    <div className="flex items-center justify-end gap-2"><Mail size={12}/> {company.email}</div>
                    <div className="flex items-center justify-end gap-2"><Globe size={12}/> {company.website}</div>
                </div>
            </div>

            {/* Invoice Info */}
            <div className="flex justify-between items-end mb-8 bg-slate-50 p-6 rounded-lg">
                <div>
                    <h2 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">Bill To</h2>
                    <p className="text-slate-900 font-bold text-lg">{sale.customerName}</p>
                </div>
                <div className="text-right">
                    <h1 className="text-3xl font-black text-slate-900 mb-2">INVOICE</h1>
                    <div className="grid grid-cols-2 gap-x-4 text-sm font-medium">
                        <span className="text-slate-400">Invoice No:</span>
                        <span className="text-slate-900">{sale.invoiceNo}</span>
                        <span className="text-slate-400">Date:</span>
                        <span className="text-slate-900">{format(new Date(sale.date), 'dd MMM yyyy')}</span>
                    </div>
                </div>
            </div>

            {/* Table */}
            <table className="w-full mb-8">
                <thead>
                    <tr className="border-b-2 border-slate-900 text-left text-sm font-bold uppercase text-slate-900">
                        <th className="py-2">Item Description</th>
                        <th className="py-2 text-center">Qty</th>
                        <th className="py-2 text-right">Price</th>
                        <th className="py-2 text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {sale.items.map((item, i) => (
                        <tr key={i} className="border-b border-slate-100 text-sm">
                            <td className="py-4 font-medium text-slate-900">{item.productName}</td>
                            <td className="py-4 text-center text-slate-600">{item.quantity}</td>
                            <td className="py-4 text-right text-slate-600">{company.currencySymbol}{item.unitPrice.toLocaleString()}</td>
                            <td className="py-4 text-right font-bold text-slate-900">{company.currencySymbol}{item.total.toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-12">
                <div className="w-64 space-y-3">
                    <div className="flex justify-between text-sm text-slate-500">
                        <span>Subtotal:</span>
                        <span className="text-slate-900 font-medium">{company.currencySymbol}{sale.subTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500">
                        <span>Discount:</span>
                        <span className="text-rose-600 font-medium">-{company.currencySymbol}{sale.discount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-900 pt-3 text-lg font-black bg-slate-900 text-white p-3 rounded">
                        <span>Total Paid:</span>
                        <span>{company.currencySymbol}{sale.paidAmount.toLocaleString()}</span>
                    </div>
                    {sale.dueAmount > 0 && (
                        <div className="flex justify-between text-rose-600 font-bold px-3 py-1 bg-rose-50 rounded">
                            <span>Balance Due:</span>
                            <span>{company.currencySymbol}{sale.dueAmount.toLocaleString()}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="border-t pt-8 text-center text-slate-400 text-xs">
                <p className="mb-2 font-bold uppercase text-slate-500 tracking-widest">Thank you for your business!</p>
                <p>This is a computer generated invoice and does not require a physical signature.</p>
            </div>
            
            <style jsx global>{`
                @media print {
                    body * { visibility: hidden; }
                    #printable-invoice, #printable-invoice * { visibility: visible; }
                    #printable-invoice {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    @page {
                        margin: 20mm;
                    }
                }
            `}</style>
        </div>
    );
}
