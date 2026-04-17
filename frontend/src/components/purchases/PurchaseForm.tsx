'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Search, Loader2, Save, PackageSearch, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CustomDatePicker } from '@/components/ui/custom-date-picker';
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
    const [purchaseNo, setPurchaseNo] = useState('');
    const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    const [items, setItems] = useState<PurchaseItem[]>([]);
    const [paidAmount, setPaidAmount] = useState<number | string>(0);
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
                const [prodRes, suppRes, nextNoRes] = await Promise.all([
                    api.get('/products'),
                    api.get('/suppliers'),
                    !purchaseId ? api.get('/purchases/next-purchase-number') : Promise.resolve({ data: { purchaseNo: '' } })
                ]);

                const productList = prodRes.data?.data || prodRes.data || [];
                setProducts(productList);
                setSuppliers(suppRes.data || []);
                if (!purchaseId) setPurchaseNo(nextNoRes.data.purchaseNo);

                if (purchaseId) {
                    const purchaseRes = await api.get(`/purchases/${purchaseId}`);
                    const p = purchaseRes.data;
                    setPurchaseNo(p.purchaseNo);
                    setDate(format(new Date(p.date), "yyyy-MM-dd'T'HH:mm"));
                    setSupplierId(p.supplierId?.toString() || '');
                    setPaidAmount(p.paidAmount);
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
    const totalAmount = subTotal;
    const dueAmount = totalAmount - (parseFloat(paidAmount.toString()) || 0);

    useEffect(() => {
        if (!purchaseId) setPaidAmount(totalAmount);
    }, [totalAmount, purchaseId]);

    const handleSave = async () => {
        if (!supplierId) return toast({ title: 'Required', description: 'Please select a supplier', variant: 'destructive' });
        if (!purchaseNo) return toast({ title: 'Required', description: 'Purchase Number is required', variant: 'destructive' });
        if (items.length === 0) return toast({ title: 'Required', description: 'Add at least one item', variant: 'destructive' });

        try {
            setSaving(true);
            const purchaseData = {
                purchaseNo,
                date,
                supplierId: parseInt(supplierId),
                paidAmount: parseFloat(paidAmount.toString()) || 0,
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
                    <h2 className="font-bold uppercase">
                        {purchaseId ? 'Edit Purchase' : 'New Purchase'}
                    </h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                        No: {purchaseNo} • Record items received from suppliers
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={onCancel} className="font-bold border-slate-200">Cancel</Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-slate-900 hover:bg-black text-white px-8 font-black uppercase tracking-widest shadow-lg shadow-slate-200"
                    >
                        {saving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                        {purchaseId ? 'Update' : 'Save'}
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 overflow-hidden min-h-0 p-4">
                {/* Left Side: Product Selector & List */}
                <div className="lg:col-span-3 flex flex-col min-h-0 bg-white border rounded-xl shadow-sm overflow-hidden">
                    <div className="bg-slate-50/80 border-b py-3 px-6 flex items-center justify-between shrink-0">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tighter">Line Items</h3>
                        </div>

                        {/* Searchable Product Selector */}
                        <div className="relative w-96">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    className="pl-10 h-10 border-slate-300 focus:ring-blue-500 shadow-sm text-sm"
                                    placeholder="Search product name or SKU..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setIsProductListOpen(true);
                                    }}
                                    onFocus={() => setIsProductListOpen(true)}
                                />
                            </div>

                            {isProductListOpen && searchQuery && (
                                <div className="absolute top-full left-0 w-full bg-white border rounded-lg shadow-2xl mt-1 z-50 overflow-hidden max-h-80 overflow-y-auto animate-in fade-in duration-200">
                                    {filteredProducts.length === 0 ? (
                                        <div className="p-4 text-center text-sm text-slate-400">No products found</div>
                                    ) : (
                                        <div className="divide-y text-slate-950">
                                            {filteredProducts.map(p => (
                                                <button
                                                    key={p.id}
                                                    className="w-full text-left p-3 hover:bg-blue-50 flex justify-between items-center transition-colors group"
                                                    onClick={() => addItem(p)}
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-900 group-hover:text-blue-700">{p.name}</span>
                                                        <span className="text-xs text-slate-500 uppercase">SKU: {p.sku || 'N/A'} • Stock: {p.stockQuantity}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-right mr-2">
                                                            <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">৳{p.purchasePrice?.toLocaleString() || 0}</div>
                                                            <div className="text-[10px] text-slate-400 font-bold uppercase">Recent Cost</div>
                                                        </div>
                                                        <Plus className="h-4 w-4 text-slate-300 group-hover:text-blue-500" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-0 bg-white">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50/50 border-b text-[10px] uppercase font-bold text-slate-500 tracking-wider sticky top-0 bg-slate-50 z-10">
                                <tr>
                                    <th className="px-6 py-4 text-left">Product Details</th>
                                    <th className="px-6 py-4 text-center w-32">Quantity</th>
                                    <th className="px-6 py-4 text-center w-40">Unit Cost</th>
                                    <th className="px-6 py-4 text-right pr-10">Total</th>
                                    <th className="px-6 py-4 w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-24 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-3 opacity-40">
                                                <PackageSearch size={48} />
                                                <p className="text-sm font-medium">Your cart is empty. Search products above to begin.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : items.map((item, index) => (
                                    <tr key={item.productId} className="hover:bg-slate-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-900">{item.productName}</p>
                                            <p className="text-xs text-slate-500">Current Stock: <span className="text-slate-700 font-bold">{products.find(p => p.id === item.productId)?.stockQuantity || 0}</span></p>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Input
                                                type="number"
                                                min="1"
                                                className="h-9 text-center border-slate-200 font-medium"
                                                value={item.quantity}
                                                onChange={e => updateItem(item.productId, 'quantity', parseFloat(e.target.value) || 0)}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <Input
                                                type="number"
                                                className="h-9 text-right font-medium text-blue-600 border-slate-200"
                                                value={item.unitCost}
                                                onChange={e => updateItem(item.productId, 'unitCost', parseFloat(e.target.value) || 0)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-900 pr-10">
                                            ৳{item.total.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeItem(item.productId)}
                                                className="h-8 w-8 text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Side: Supplier & Payment Details */}
                <div className="space-y-6 flex flex-col h-full overflow-y-auto">
                    <Card className="shadow-sm border-slate-200 shrink-0">
                        <CardHeader className="py-3 px-6 border-b bg-slate-50/50">
                            <CardTitle className="text-sm font-bold text-slate-900 uppercase tracking-tighter">Supplier Info</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <Select value={supplierId} onValueChange={setSupplierId}>
                                <SelectTrigger className="h-10 border-slate-300">
                                    <SelectValue placeholder="Select Supplier..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {suppliers.map(s => (
                                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <CustomDatePicker
                                type="datetime-local"
                                value={date}
                                onChange={setDate}
                                className="border-slate-300"
                            />
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900 text-white border-none shadow-2xl flex-1 flex flex-col">
                        <CardHeader className="border-b border-slate-800 py-4 px-6 shrink-0">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-base font-bold">Summary</CardTitle>
                                <Info size={16} className="text-slate-500" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="flex justify-between text-slate-400 font-medium">
                                    <span>Total Amount:</span>
                                    <span>৳{subTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center gap-4">
                                    <span className="text-slate-400 font-medium whitespace-nowrap">Paid Amount:</span>
                                    <Input
                                        type="number"
                                        className="h-10 bg-slate-800 border-slate-700 text-right text-emerald-400 font-bold text-lg focus:ring-emerald-500"
                                        value={paidAmount}
                                        onChange={(e) => setPaidAmount(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="mt-8">
                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] block mb-2">
                                    {dueAmount > 0 ? 'Balance Due' : 'Paid in Full'}
                                </span>
                                <div className={`text-5xl font-black tracking-tighter ${dueAmount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    ৳{dueAmount.toLocaleString()}
                                </div>
                                <div className="h-1 w-full bg-slate-800 rounded-full mt-6 overflow-hidden">
                                    <div className={`h-full ${dueAmount > 0 ? 'bg-rose-500' : 'bg-emerald-500'} w-full animate-pulse`}></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Backdrop for product search */}
            {isProductListOpen && (
                <div className="fixed inset-0 z-10" onClick={() => setIsProductListOpen(false)} />
            )}
        </div>
    );
}
