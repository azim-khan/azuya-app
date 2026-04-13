'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import { useRouter } from 'next/navigation';
import { Search, Trash2, Plus, Save } from 'lucide-react';

export default function NewPurchase() {
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);

    const [selectedSupplierId, setSelectedSupplierId] = useState<number | ''>('');
    const [cart, setCart] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [prodRes, suppRes] = await Promise.all([
                api.get('/products'),
                api.get('/suppliers')
            ]);
            setProducts(prodRes.data);
            setSuppliers(suppRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    const addToCart = (product: any) => {
        setCart(prev => {
            const existing = prev.find(item => item.productId === product.id);
            if (existing) return prev;
            // Default unit cost to current purchase price or 0
            return [...prev, { productId: product.id, name: product.name, unitCost: product.purchasePrice || 0, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: number) => {
        setCart(prev => prev.filter(item => item.productId !== productId));
    };

    const updateItem = (productId: number, field: string, value: number) => {
        if (value < 0) return;
        setCart(prev => prev.map(item => item.productId === productId ? { ...item, [field]: value } : item));
    };

    const totalAmount = cart.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);

    const handleSubmit = async () => {
        if (!selectedSupplierId || cart.length === 0) {
            alert('Please select a supplier and add items.');
            return;
        }

        try {
            const payload = {
                supplierId: Number(selectedSupplierId),
                items: cart.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitCost: item.unitCost
                }))
            };

            await api.post('/purchases', payload);
            router.push('/purchases');
        } catch (err: any) {
            alert(err.response?.data || 'Failed to create purchase');
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
            {/* Product Selection */}
            <div className="lg:col-span-1 flex flex-col gap-4">
                <div className="card p-4">
                    <h3 className="font-bold mb-2">Select Products</h3>
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                        {products.map(product => (
                            <div
                                key={product.id}
                                onClick={() => addToCart(product)}
                                className="p-3 border rounded hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                            >
                                <div>
                                    <p className="font-medium text-sm">{product.name}</p>
                                    <p className="text-xs text-slate-500">Stock: {product.stockQuantity}</p>
                                </div>
                                <Plus size={16} className="text-blue-500" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Cart / Checkout */}
            <div className="lg:col-span-2 card flex flex-col h-full">
                <h2 className="text-xl font-bold mb-4">Stock Entry (Purchase)</h2>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-600 mb-1">Supplier</label>
                    <select
                        className="input"
                        value={selectedSupplierId}
                        onChange={e => setSelectedSupplierId(Number(e.target.value))}
                    >
                        <option value="">Select Supplier</option>
                        {suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex-1 overflow-y-auto w-full">
                    <table className="table w-full">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Cost</th>
                                <th>Qty</th>
                                <th>Total</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {cart.length === 0 ? (
                                <tr><td colSpan={5} className="text-center p-8 text-slate-400">No items added</td></tr>
                            ) : (
                                cart.map(item => (
                                    <tr key={item.productId}>
                                        <td className="font-medium">{item.name}</td>
                                        <td>
                                            <input
                                                type="number"
                                                className="p-1 border rounded w-20"
                                                value={item.unitCost}
                                                onChange={e => updateItem(item.productId, 'unitCost', Number(e.target.value))}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                className="p-1 border rounded w-16"
                                                value={item.quantity}
                                                onChange={e => updateItem(item.productId, 'quantity', Number(e.target.value))}
                                            />
                                        </td>
                                        <td>${(item.quantity * item.unitCost).toFixed(2)}</td>
                                        <td>
                                            <button onClick={() => removeFromCart(item.productId)} className="text-red-500 hover:text-red-700">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="border-t pt-4 space-y-4">
                    <div className="flex justify-between text-lg font-bold">
                        <span>Total Payable</span>
                        <span>${totalAmount.toFixed(2)}</span>
                    </div>

                    <button onClick={handleSubmit} disabled={cart.length === 0} className="btn btn-primary w-full py-3 text-lg">
                        <Save size={20} /> Save Purchase
                    </button>
                </div>
            </div>
        </div>
    );
}
