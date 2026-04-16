'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '@/services/api';
import { Trash2, Save, Printer, PackageSearch, Info, X, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import InvoicePrinter from '@/components/sales/InvoicePrinter';

interface Product {
    id: number;
    name: string;
    salePrice: number;
    stockQuantity: number;
    unitName: string;
}

interface Customer {
    id: number;
    name: string;
}

interface SaleItem {
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    stockLeft: number;
    total: number;
}

interface SaleFormProps {
    saleId?: number | null;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export default function SaleForm({ saleId, onSuccess, onCancel }: SaleFormProps) {
    const { toast } = useToast();

    // Data states
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [lastSaleId, setLastSaleId] = useState<number | null>(null);
    const [showInvoice, setShowInvoice] = useState(false);

    // Form states
    const [invoiceNo, setInvoiceNo] = useState('');
    const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    const [customerId, setCustomerId] = useState<string>('');
    const [items, setItems] = useState<SaleItem[]>([]);
    const [discount, setDiscount] = useState<string | number>('');
    const [paidAmount, setPaidAmount] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    // Searchable Select state
    const [productSearch, setProductSearch] = useState('');
    const [isProductListOpen, setIsProductListOpen] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Load base data
                const [prodRes, custRes, invoiceRes] = await Promise.all([
                    api.get('/products'),
                    api.get('/customers'),
                    api.get('/sales/next-invoice-number')
                ]);

                const productList = prodRes.data?.data || prodRes.data || [];
                const customerList = custRes.data || [];

                setProducts(productList);
                setCustomers(customerList);

                // If editing, load the specific sale
                if (saleId) {
                    const saleRes = await api.get(`/sales/${saleId}`);
                    const s = saleRes.data;

                    setInvoiceNo(s.invoiceNo);
                    setDate(format(new Date(s.date), "yyyy-MM-dd'T'HH:mm"));
                    setCustomerId(s.customerId?.toString() || '');
                    setDiscount(s.discount);
                    setPaidAmount(s.paidAmount);

                    setItems(s.items.map((item: any) => ({
                        productId: item.productId,
                        productName: item.productName,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        total: item.total,
                        // For edit mode, we need to know the 'actual' stock available if we were to cancel these items
                        // We'll approximate this by adding the current quantity to the current product stock
                        stockLeft: (productList.find((p: any) => p.id === item.productId)?.stockQuantity || 0) + item.quantity
                    })));
                } else {
                    setInvoiceNo(invoiceRes.data?.invoiceNo || '');
                }
            } catch (error) {
                console.error('Data load failed:', error);
                toast({ title: 'Error', description: 'Failed to initialize sales form.', variant: 'destructive' });
            }
        };
        loadInitialData();
    }, [toast, saleId]);

    const addItem = (productId: string) => {
        const product = products.find(p => p.id === parseInt(productId));
        if (!product) return;

        if (items.some(i => i.productId === product.id)) {
            toast({ title: 'Notice', description: 'Product already added. Adjust quantity instead.' });
            return;
        }

        if (product.stockQuantity <= 0) {
            toast({ title: 'Error', description: 'Product out of stock.', variant: 'destructive' });
            return;
        }

        setItems([...items, {
            productId: product.id,
            productName: product.name,
            quantity: 1,
            unitPrice: product.salePrice,
            stockLeft: product.stockQuantity,
            total: product.salePrice
        }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, updates: Partial<SaleItem>) => {
        const newItems = [...items];
        const item = newItems[index];
        const updatedItem = { ...item, ...updates };

        if (updatedItem.quantity > item.stockLeft) {
            toast({ title: 'Warning', description: `Only ${item.stockLeft} in stock.`, variant: 'destructive' });
            updatedItem.quantity = item.stockLeft;
        }

        updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
        newItems[index] = updatedItem;
        setItems(newItems);
    };

    const subTotal = useMemo(() => items.reduce((sum, i) => sum + i.total, 0), [items]);
    const totalAmount = subTotal - (parseFloat(discount.toString()) || 0);
    const dueAmount = totalAmount - paidAmount;

    useEffect(() => {
        setPaidAmount(totalAmount);
    }, [totalAmount]);

    const filteredProducts = useMemo(() => {
        if (!productSearch) return [];
        return products.filter(p =>
            p.name.toLowerCase().includes(productSearch.toLowerCase())
        ).slice(0, 10);
    }, [products, productSearch]);

    const handleSave = async (print: boolean = false) => {
        if (items.length === 0) {
            toast({ title: 'Missing Info', description: 'Add at least one product.' });
            return;
        }

        setIsSaving(true);
        try {
            const saleData = {
                invoiceNo,
                date,
                customerId: customerId ? parseInt(customerId) : null,
                discount: parseFloat(discount.toString()) || 0,
                paidAmount,
                items: items.map(i => ({
                    productId: i.productId,
                    quantity: i.quantity,
                    unitPrice: i.unitPrice
                }))
            };

            const res = saleId
                ? await api.put(`/sales/${saleId}`, saleData)
                : await api.post('/sales', saleData);

            const returnedId = res.data?.id || res.data; // Handle both {id: x} and direct ID

            if (!returnedId) throw new Error("Server did not return a Sale ID");

            setLastSaleId(returnedId);
            toast({ title: 'Success', description: `Sale ${saleId ? 'updated' : 'saved'} successfully!` });

            if (print) {
                setShowInvoice(true);
                // Give a small delay for the invoice component to render completely
                setTimeout(async () => {
                    window.print();
                    // Automatically trigger success (close and refresh list) after print dialog is closed
                    onSuccess?.();
                }, 800);
            } else {
                onSuccess?.();
            }
        } catch (error: any) {
            console.error('Save failed:', error);
            const errorMsg = error.response?.data?.message || error.response?.data || error.message || 'Failed to process sale.';
            toast({
                title: 'Save Failed',
                description: errorMsg,
                variant: 'destructive'
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (showInvoice && lastSaleId) {
        return (
            <div className="space-y-6 max-h-[80vh] overflow-y-auto p-4 print:max-h-none print:overflow-visible">
                <InvoicePrinter saleId={lastSaleId} />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white p-1">
            {/* Header / Actions - Sticky to top */}
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border mb-4 sticky top-0 z-30 shrink-0">
                <div className="flex flex-col">
                    <h2 className="text-xl font-bold text-slate-900 leading-tight">Create New Sale</h2>
                    <p className="text-xs text-slate-500 font-medium">Invoice: <span className="text-slate-900 font-bold">{invoiceNo}</span> | {format(new Date(date), 'dd/MM/yyyy p')}</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={onCancel} disabled={isSaving} className="border-slate-300">
                        Cancel
                    </Button>
                    <Button variant="outline" disabled={isSaving} onClick={() => handleSave(false)} className="border-slate-900 text-slate-900 hover:bg-slate-50 font-bold">
                        <Save className="mr-2 h-4 w-4" /> {saleId ? 'Update Sale' : 'Save Only'}
                    </Button>
                    <Button disabled={isSaving} onClick={() => handleSave(true)} className="bg-slate-900 hover:bg-black text-white font-bold">
                        <Printer className="mr-2 h-4 w-4" /> {saleId ? 'Update & Print' : 'Save & Print'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 overflow-hidden min-h-0 px-1 pb-4">
                {/* Left Side: Product Selector & List */}
                <div className="lg:col-span-3 flex flex-col min-h-0 bg-white border rounded-xl shadow-sm overflow-hidden">
                    <div className="bg-slate-50/80 border-b py-3 px-6 flex items-center justify-between shrink-0">
                        <div>
                            <CardTitle className="text-base font-bold text-slate-900">Cart Items</CardTitle>
                        </div>

                        {/* Custom Searchable Product Selector */}
                        <div className="relative w-96">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    className="pl-10 h-10 border-slate-300 focus:ring-blue-500 shadow-sm text-sm"
                                    placeholder="Search product name..."
                                    value={productSearch}
                                    onChange={(e) => {
                                        setProductSearch(e.target.value);
                                        setIsProductListOpen(true);
                                    }}
                                    onFocus={() => setIsProductListOpen(true)}
                                />
                            </div>

                            {isProductListOpen && productSearch && (
                                <div className="absolute top-full left-0 w-full bg-white border rounded-lg shadow-2xl mt-1 z-50 overflow-hidden max-h-80 overflow-y-auto">
                                    {filteredProducts.length === 0 ? (
                                        <div className="p-4 text-center text-sm text-slate-400">No products found</div>
                                    ) : (
                                        <div className="divide-y text-slate-950">
                                            {filteredProducts.map(p => (
                                                <button
                                                    key={p.id}
                                                    className="w-full text-left p-3 hover:bg-blue-50 flex justify-between items-center transition-colors group"
                                                    onClick={() => {
                                                        addItem(p.id.toString());
                                                        setProductSearch('');
                                                        setIsProductListOpen(false);
                                                    }}
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-900 group-hover:text-blue-700">{p.name}</span>
                                                        <span className="text-xs text-slate-500">Price: ৳{p.salePrice}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant={p.stockQuantity > 5 ? "outline" : "destructive"} className="px-2 py-0.5 rounded-md text-[10px] whitespace-nowrap">
                                                            Stock: {p.stockQuantity}
                                                        </Badge>
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
                                    <th className="px-6 py-4 text-center w-40">Unit Price</th>
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
                                            <p className="text-xs text-slate-500">Current Stock: <span className="text-slate-700 font-bold">{item.stockLeft}</span></p>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Input
                                                type="number"
                                                min="1"
                                                className="h-9 text-center border-slate-200"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, { quantity: parseFloat(e.target.value) || 0 })}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <Input
                                                type="number"
                                                className="h-9 text-right font-medium text-blue-600 border-slate-200"
                                                value={item.unitPrice}
                                                onChange={(e) => updateItem(index, { unitPrice: parseFloat(e.target.value) || 0 })}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-900 pr-10">
                                            ৳{item.total.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Button variant="ghost" size="icon" onClick={() => removeItem(index)} className="h-8 w-8 text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Side: Customer & Payment - Sticky/Fixed Height */}
                <div className="space-y-6 flex flex-col h-full overflow-y-auto">
                    <Card className="shadow-sm border-slate-200 shrink-0">
                        <CardHeader className="py-3 px-6 border-b bg-slate-50/50">
                            <CardTitle className="text-sm font-bold text-slate-900 uppercase tracking-tighter">Customer Info</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <Select value={customerId} onValueChange={setCustomerId}>
                                <SelectTrigger className="h-10 border-slate-300">
                                    <SelectValue placeholder="Select Customer..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers.map(c => (
                                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input
                                type="datetime-local"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="h-10 border-slate-300 text-slate-600"
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
                        <CardContent className="p-6 space-y-4 flex-1">
                            <div className="flex justify-between text-slate-400 font-medium">
                                <span>Sub Total:</span>
                                <span>৳{subTotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center gap-4">
                                <span className="text-slate-400 font-medium whitespace-nowrap">Discount Amt:</span>
                                <Input
                                    type="number"
                                    className="h-10 bg-slate-800 border-slate-700 text-right text-rose-400 font-bold text-lg focus:ring-rose-500"
                                    value={discount}
                                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                />
                            </div>
                            <div className="border-t border-slate-800 my-4 pt-4">
                                <div className="flex justify-between text-2xl font-black">
                                    <span>Total:</span>
                                    <span className="text-emerald-400">৳{totalAmount.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="space-y-2 mt-8">
                                <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Received Cash</label>
                                <Input
                                    type="number"
                                    className="h-14 bg-white text-slate-900 text-2xl font-black text-right focus:ring-blue-500"
                                    value={paidAmount}
                                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-800/40 p-6 flex flex-col gap-2 shrink-0">
                            <div className="flex justify-between w-full font-bold">
                                <span className="text-slate-400">Balance Due:</span>
                                <span className={cn("text-xl", dueAmount > 0 ? "text-rose-400" : "text-emerald-400 font-black italic")}>
                                    {dueAmount <= 0 ? "PAID" : `৳${dueAmount.toLocaleString()}`}
                                </span>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
