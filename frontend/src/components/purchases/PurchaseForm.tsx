'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, Search, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface PurchaseItem {
    productId: number;
    productName: string;
    quantity: number;
    unitCost: number;
    total: number;
}

interface PurchaseFormProps {
    purchaseId?: number | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function PurchaseForm({ purchaseId, onSuccess, onCancel }: PurchaseFormProps) {
    const [supplierId, setSupplierId] = useState<string>('');
    const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    const [items, setItems] = useState<PurchaseItem[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [isProductListOpen, setIsProductListOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [prodRes, suppRes] = await Promise.all([
                    api.get('/products'),
                    api.get('/suppliers')
                ]);

                const productList = prodRes.data?.data || prodRes.data || [];
                setProducts(productList);
                setSuppliers(suppRes.data || []);

                if (purchaseId) {
                    const purchaseRes = await api.get(`/purchases/${purchaseId}`);
                    const p = purchaseRes.data;
                    setDate(format(new Date(p.date), "yyyy-MM-dd'T'HH:mm"));
                    setSupplierId(p.supplierId?.toString() || '');
                    setItems(p.items.map((item: any) => ({
                        productId: item.productId,
                        productName: item.productName,
                        quantity: item.quantity,
                        unitCost: item.unitCost,
                        total: item.total
                    })));
                }
            } catch (error) {
                console.error('Failed to load data:', error);
                toast({ title: 'Error', description: 'Failed to load form data', variant: 'destructive' });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [purchaseId]);

    const filteredProducts = useMemo(() => {
        if (!searchQuery) return products.slice(0, 10);
        return products.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 10);
    }, [products, searchQuery]);

    const addItem = (product: any) => {
        const existing = items.find(i => i.productId === product.id);
        if (existing) {
            updateItem(product.id, 'quantity', existing.quantity + 1);
        } else {
            setItems([...items, {
                productId: product.id,
                productName: product.name,
                quantity: 1,
                unitCost: product.purchasePrice || 0,
                total: product.purchasePrice || 0
            }]);
        }
        setSearchQuery('');
        setIsProductListOpen(false);
    };

    const updateItem = (productId: number, field: keyof PurchaseItem, value: any) => {
        setItems(items.map(item => {
            if (item.productId === productId) {
                const updated = { ...item, [field]: value };
                updated.total = updated.quantity * updated.unitCost;
                return updated;
            }
            return item;
        }));
    };

    const removeItem = (productId: number) => {
        setItems(items.filter(i => i.productId !== productId));
    };

    const subTotal = items.reduce((sum, item) => sum + item.total, 0);

    const handleSave = async () => {
        if (!supplierId) return toast({ title: 'Required', description: 'Please select a supplier', variant: 'destructive' });
        if (items.length === 0) return toast({ title: 'Required', description: 'Add at least one item', variant: 'destructive' });

        try {
            setSaving(true);
            const purchaseData = {
                date,
                supplierId: parseInt(supplierId),
                items: items.map(i => ({
                    productId: i.productId,
                    quantity: i.quantity,
                    unitCost: i.unitCost
                }))
            };

            if (purchaseId) {
                await api.put(`/purchases/${purchaseId}`, purchaseData);
            } else {
                await api.post('/purchases', purchaseData);
            }
            
            toast({ title: 'Success', description: `Purchase ${purchaseId ? 'updated' : 'recorded'} successfully!` });
            onSuccess();
        } catch (error: any) {
            toast({ title: 'Error', description: error.response?.data || 'Failed to save purchase', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-slate-400" /></div>;

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <header className="p-6 bg-white border-b flex justify-between items-center sticky top-0 z-20 shadow-sm">
                <div>
                   <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                        {purchaseId ? 'Edit Purchase' : 'New Purchase Entry'}
                    </h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Record items received from suppliers</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={onCancel} className="font-bold border-slate-200">Cancel</Button>
                    <Button 
                        onClick={handleSave} 
                        disabled={saving} 
                        className="bg-slate-900 hover:bg-black text-white px-8 font-black uppercase tracking-widest shadow-lg shadow-slate-200"
                    >
                        {saving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                        {purchaseId ? 'Update Record' : 'Save & Confirm'}
                    </Button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Meta Grid */}
                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Purchase Information</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-600">Purchase Date</Label>
                                <Input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="font-medium bg-slate-50 border-none h-11" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-600">Supplier</Label>
                                <select 
                                    className="w-full h-11 bg-slate-50 border-none rounded-md px-3 text-sm font-medium focus:ring-2 focus:ring-slate-900"
                                    value={supplierId}
                                    onChange={e => setSupplierId(e.target.value)}
                                >
                                    <option value="">Select Supplier</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-2xl text-white flex flex-col justify-center items-end shadow-xl">
                        <span className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-2">Grand Total</span>
                        <div className="text-5xl font-black">৳{subTotal.toLocaleString()}</div>
                    </div>
                </div>

                {/* Product Search & Table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                    <div className="p-4 bg-slate-50 border-b flex justify-between items-center gap-4">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-slate-400" />
                            </div>
                            <Input 
                                placeholder="Search products by name or SKU..." 
                                className="pl-10 h-11 bg-white border-slate-200"
                                value={searchQuery}
                                onChange={e => {
                                    setSearchQuery(e.target.value);
                                    setIsProductListOpen(true);
                                }}
                                onFocus={() => setIsProductListOpen(true)}
                            />
                            {isProductListOpen && filteredProducts.length > 0 && (
                                <div className="absolute z-30 w-full mt-2 bg-white border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    {filteredProducts.map(p => (
                                        <div 
                                            key={p.id} 
                                            className="p-4 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b last:border-none group"
                                            onClick={() => addItem(p)}
                                        >
                                            <div>
                                                <div className="font-black text-slate-900 group-hover:text-black">{p.name}</div>
                                                <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">SKU: {p.sku || 'N/A'} • Stock: {p.stockQuantity}</div>
                                            </div>
                                            <div className="text-right">
                                               <div className="font-black text-slate-900">৳{p.purchasePrice?.toLocaleString() || 0}</div>
                                               <div className="text-[10px] items-center text-slate-400 font-black uppercase">Recent Cost</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <Button variant="outline" onClick={() => setIsProductListOpen(!isProductListOpen)} className="font-bold">
                            <Plus className="h-4 w-4 mr-2" /> List
                        </Button>
                    </div>

                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b">
                            <tr>
                                <th className="px-6 py-4 text-left">Product Description</th>
                                <th className="px-6 py-4 text-center w-32">Unit Cost</th>
                                <th className="px-6 py-4 text-center w-32">Quantity</th>
                                <th className="px-6 py-4 text-right w-40">Total</th>
                                <th className="px-6 py-4 text-center w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-400 font-medium italic">No items added. Start by searching for products above.</td>
                                </tr>
                            ) : items.map(item => (
                                <tr key={item.productId} className="hover:bg-slate-50/50 transition-all group">
                                    <td className="px-6 py-5">
                                        <div className="font-black text-slate-900 group-hover:text-black">{item.productName}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <Input 
                                            type="number" 
                                            value={item.unitCost} 
                                            onChange={e => updateItem(item.productId, 'unitCost', parseFloat(e.target.value) || 0)}
                                            className="h-9 text-center font-bold bg-white"
                                        />
                                    </td>
                                    <td className="px-6 py-5">
                                        <Input 
                                            type="number" 
                                            value={item.quantity} 
                                            onChange={e => updateItem(item.productId, 'quantity', parseFloat(e.target.value) || 0)}
                                            className="h-9 text-center font-bold bg-white"
                                        />
                                    </td>
                                    <td className="px-6 py-5 text-right font-black text-lg text-slate-900">
                                        ৳{item.total.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <Button variant="ghost" size="sm" onClick={() => removeItem(item.productId)} className="text-red-300 hover:text-red-600 hover:bg-red-50 rounded-full h-8 w-8 p-0">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Click away for search */}
            {isProductListOpen && (
                <div className="fixed inset-0 z-10" onClick={() => setIsProductListOpen(false)} />
            )}
        </div>
    );
}
