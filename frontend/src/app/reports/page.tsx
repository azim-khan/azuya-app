'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import { FileBarChart, Download } from 'lucide-react';

export default function Reports() {
    const [stockReport, setStockReport] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStockReport();
    }, []);

    const fetchStockReport = async () => {
        try {
            const res = await api.get('/reports/stock');
            setStockReport(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const totalStockValue = stockReport.reduce((sum, item) => sum + item.stockValue, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Reports</h2>
                    <p className="text-slate-500">Financial and inventory reports.</p>
                </div>
                <button className="btn btn-outline" onClick={() => window.print()}>
                    <Download size={18} /> Export / Print
                </button>
            </div>

            <div className="card p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <FileBarChart className="text-blue-500" /> Stock Valuation Report
                </h3>

                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Quantity</th>
                                <th>Unit</th>
                                <th>Cost Price</th>
                                <th>Stock Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="text-center p-8">Loading...</td></tr>
                            ) : (
                                stockReport.map(item => (
                                    <tr key={item.id}>
                                        <td className="font-medium">{item.name}</td>
                                        <td>{item.category}</td>
                                        <td>{item.stockQuantity}</td>
                                        <td>{item.unit}</td>
                                        <td>${item.purchasePrice.toFixed(2)}</td>
                                        <td className="font-bold">${item.stockValue.toFixed(2)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot className="border-t-2 border-slate-200">
                            <tr>
                                <td colSpan={5} className="font-bold text-right pt-4">Total Inventory Value:</td>
                                <td className="font-bold pt-4 text-lg text-blue-600">${totalStockValue.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}
