'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import { format } from 'date-fns';

interface InvoiceItem {
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

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
    items: InvoiceItem[];
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
                setLoading(true);

                // Fetch company info (required for both demo and real)
                const companyRes = await api.get('/companyinfo');
                setCompany(companyRes.data);

                if (saleId === 'demo') {
                    // Generate 25 dummy items for multi-page demonstration
                    const dummyItems: InvoiceItem[] = Array.from({ length: 25 }, (_, i) => ({
                        productName: `Product Line Item #${i + 1} - High Quality Description`,
                        quantity: Math.floor(Math.random() * 5) + 1,
                        unitPrice: Math.floor(Math.random() * 1000) + 100,
                        total: 0
                    })).map(item => ({ ...item, total: item.quantity * item.unitPrice }));

                    const subTotal = dummyItems.reduce((sum, item) => sum + item.total, 0);

                    setSale({
                        invoiceNo: 'DEMO-12345',
                        date: new Date().toISOString(),
                        customerName: 'Demo Corporate Client Pvt Ltd',
                        subTotal: subTotal,
                        discount: 500,
                        totalAmount: subTotal - 500,
                        paidAmount: subTotal - 500,
                        dueAmount: 0,
                        paymentStatus: 'Paid',
                        items: dummyItems
                    });
                } else {
                    const saleRes = await api.get(`/sales/${saleId}`);
                    setSale(saleRes.data);
                }
            } catch (error) {
                console.error('Failed to load invoice data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [saleId]);

    if (loading) return <div className="p-12 text-center text-slate-500 font-medium animate-pulse">Generating Professional Invoice...</div>;
    if (!sale || !company) return <div className="p-12 text-center text-rose-500 font-bold border-2 border-dashed border-rose-200 rounded-xl">Error: Invoice data could not be retrieved.</div>;

    const currency = company.currencySymbol || '৳';

    return (
        <div className="bg-white text-slate-900 font-sans print:p-0">
            {/* A4 Container */}
            <div className="mx-auto w-[794px] min-h-[1123px] bg-white p-[20mm] flex flex-col print:w-full print:min-h-0 print:p-0 overflow-visible" id="printable-invoice-v2">

                {/* Header Section */}
                <header className="mb-4 border-b-2 border-slate-900 pb-8">
                    <div>
                        <h3 className="font-black text-center text-slate-900 tracking-tighter">INVOICE</h3>
                    </div>
                    <div className="pt-4 flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2">
                                {company.logo && (
                                    <img src={company.logo} alt="Company Logo" className="h-16 w-auto object-contain" />
                                )}
                                <div>
                                    <h3 className="font-black uppercase tracking-tight text-slate-900">{company.name}</h3>
                                    <p className="text-sm font-medium text-slate-500">{company.tagline}</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-[12px]" style={{ flex: "0 0 230px" }}>
                            <div className="flex gap-4 items-center">
                                <span style={{ width: '55px' }} className="text-slate-400 uppercase tracking-wider">Mobile</span>
                                <span>{company.mobile}</span>
                            </div>
                            <div className="flex gap-4 items-center">
                                <span style={{ width: '55px' }} className="text-slate-400 uppercase tracking-wider">Email</span>
                                <span>{company.email}</span>
                            </div>
                            <div className="flex gap-4 items-center">
                                <span style={{ width: '55px' }} className="text-slate-400 uppercase tracking-wider">Website</span>
                                <span>{company.website}</span>
                            </div>
                            <div className="mt-1">
                                {company.address}
                            </div>
                        </div>
                    </div>
                    <div className="pt-6 flex justify-between">
                        <div className="flex flex-col">
                            <div className="flex gap-4 items-center font-bold">
                                <span style={{ width: '65px' }} className="text-slate-400 uppercase tracking-wider text-[10px]">Invoice No</span>
                                <span className="font-mono text-sm py-1">{sale.invoiceNo}</span>
                            </div>
                            <div className="flex gap-4 items-center font-bold">
                                <span style={{ width: '65px' }} className="text-slate-400 uppercase tracking-wider text-[10px]">Date</span>
                                <span className="text-sm">{format(new Date(sale.date), 'dd/MM/yyyy p')}</span>
                            </div>
                        </div>
                        <div className="font-bold">
                            <div className="text-slate-400 text-[10px] uppercase tracking-widest">Invoice To</div>
                            <div className="text-slate-800 text-sm">{sale.customerName}</div>
                        </div>
                    </div>
                </header>

                {/* Table Section */}
                <main className="flex-1">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b-2 border-slate-900 text-[11px] font-black uppercase tracking-widest text-slate-900 text-left">
                                <th className="py-4 px-2 w-12">SL</th>
                                <th className="py-4 px-2">Item</th>
                                <th className="py-4 px-2 text-right">Price</th>
                                <th className="py-4 px-2 text-right w-24">Quantity</th>
                                <th className="py-4 px-2 text-right w-32">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {sale.items.map((item, index) => (
                                <tr key={index} className="text-sm break-inside-avoid">
                                    <td className="py-4 px-2 text-slate-400 font-medium">{index + 1}</td>
                                    <td className="py-4 px-2 font-bold text-slate-800">{item.productName}</td>
                                    <td className="py-4 px-2 text-right text-slate-600">{currency}{item.unitPrice.toLocaleString()}</td>
                                    <td className="py-4 px-2 text-right font-medium text-slate-600">{item.quantity}</td>
                                    <td className="py-4 px-2 text-right font-black text-slate-900">{currency}{item.total.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </main>

                {/* Summary Section */}
                <section className="mt-8 flex justify-end">
                    <div className="w-72 space-y-0 text-sm">
                        <div className="flex justify-between py-3 px-4 text-slate-500 border-x border-t border-slate-200 bg-slate-50/30">
                            <span className="font-bold uppercase text-[10px] tracking-widest">Subtotal</span>
                            <span className="font-bold">{currency}{sale.subTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-3 px-4 text-rose-600 border-x border-y border-slate-200 bg-slate-50/30">
                            <span className="font-bold uppercase text-[10px] tracking-widest">Discount</span>
                            <span className="font-bold">-{currency}{sale.discount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-4 px-4">
                            <span className="font-black uppercase text-[11px] tracking-widest">Grand Total</span>
                            <span className="text-xl font-black">{currency}{sale.totalAmount.toLocaleString()}</span>
                        </div>
                    </div>
                </section>

                {/* Footer Section */}
                <footer className="mt-20 pt-12 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-8 items-end">
                        <div className="space-y-6">
                            <div className="space-y-1">
                                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Terms & Conditions</h3>
                                <p className="text-[10px] text-slate-400 leading-normal italic">
                                    * Warranty is applicable as per manufacturer policy.<br />
                                    * Goods once sold are not returnable or exchangeable.
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="inline-block text-center space-y-4">
                                <div className="w-48 border-b-2 border-slate-900 h-12"></div>
                                <p className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Authorized Signature</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-[10px] mt-4">
                        Thank you for your business!
                    </div>
                </footer>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 20mm;
                    }

                    /* General overrides to clean up print */
                    body {
                        visibility: hidden !important;
                        background: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }

                    #printable-invoice-v2, #printable-invoice-v2 * {
                        visibility: visible !important;
                    }

                    #printable-invoice-v2 {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                        transform: none !important;
                    }

                    /* Header/Footer repetition support */
                    thead {
                        display: table-header-group !important;
                    }

                    tr {
                        page-break-inside: avoid !important;
                    }

                    /* Ensure the table fills the width */
                    table {
                        width: 100% !important;
                        table-layout: auto !important;
                    }

                    /* Prevent elements from being pushed to new pages unnecessarily */
                    header, section, footer {
                        page-break-inside: avoid;
                    }

                    /* Kill any background graphics that might be set by the browser */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </div>
    );
}
