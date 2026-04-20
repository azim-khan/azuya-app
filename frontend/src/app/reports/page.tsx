'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import api from '@/services/api';
import { 
    Search, 
    Download, 
    TrendingUp, 
    TrendingDown, 
    Package,
    ArrowUpRight,
    ArrowDownRight,
    CircleDollarSign,
    X
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { CustomDatePicker } from '@/components/ui/custom-date-picker';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState('stock');
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [productId, setProductId] = useState('All');
    const [products, setProducts] = useState<any[]>([]);
    
    // Product Search Dropdown States
    const [productSearch, setProductSearch] = useState('');
    const [isProductListOpen, setIsProductListOpen] = useState(false);
    const [selectedProductName, setSelectedProductName] = useState('All Products');
    const productDropdownRef = useRef<HTMLDivElement>(null);

    // Data states
    const [stockData, setStockData] = useState<any[]>([]);
    const [salesData, setSalesData] = useState<any[]>([]);
    const [purchasesData, setPurchasesData] = useState<any[]>([]);

    // Summary states
    const [stockTotal, setStockTotal] = useState(0);
    const [salesTotal, setSalesTotal] = useState(0);
    const [purchasesTotal, setPurchasesTotal] = useState(0);

    // Pagination states
    const [stockPagination, setStockPagination] = useState({ pageIndex: 0, pageSize: 50 });
    const [salesPagination, setSalesPagination] = useState({ pageIndex: 0, pageSize: 50 });
    const [purchasesPagination, setPurchasesPagination] = useState({ pageIndex: 0, pageSize: 50 });

    const [stockCount, setStockCount] = useState(0);
    const [salesCount, setSalesCount] = useState(0);
    const [purchasesCount, setPurchasesCount] = useState(0);

    const fetchProducts = useCallback(async () => {
        try {
            const res = await api.get('/products?pageSize=1000');
            setProducts(res.data.data);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        }
    }, []);

    const fetchStockValuation = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                pageIndex: (stockPagination.pageIndex + 1).toString(),
                pageSize: stockPagination.pageSize.toString(),
            });
            if (productId !== 'All') params.append('productId', productId);

            const res = await api.get(`/reports/stock-valuation?${params}`);
            setStockData(res.data.data);
            setStockCount(res.data.count);
            setStockTotal(res.data.totalValue);
        } catch (error) {
            console.error('Failed to fetch stock valuation:', error);
        } finally {
            setLoading(false);
        }
    }, [stockPagination, productId]);

    const fetchSalesReport = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                pageIndex: (salesPagination.pageIndex + 1).toString(),
                pageSize: salesPagination.pageSize.toString(),
                startDate: startDate,
                endDate: endDate,
            });
            if (productId !== 'All') params.append('productId', productId);

            const res = await api.get(`/reports/sales?${params}`);
            setSalesData(res.data.data);
            setSalesCount(res.data.count);
            setSalesTotal(res.data.totalValue);
        } catch (error) {
            console.error('Failed to fetch sales report:', error);
        } finally {
            setLoading(false);
        }
    }, [salesPagination, startDate, endDate, productId]);

    const fetchPurchasesReport = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                pageIndex: (purchasesPagination.pageIndex + 1).toString(),
                pageSize: purchasesPagination.pageSize.toString(),
                startDate: startDate,
                endDate: endDate,
            });
            if (productId !== 'All') params.append('productId', productId);

            const res = await api.get(`/reports/purchases?${params}`);
            setPurchasesData(res.data.data);
            setPurchasesCount(res.data.count);
            setPurchasesTotal(res.data.totalValue);
        } catch (error) {
            console.error('Failed to fetch purchases report:', error);
        } finally {
            setLoading(false);
        }
    }, [purchasesPagination, startDate, endDate, productId]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        if (activeTab === 'stock') fetchStockValuation();
        if (activeTab === 'sales') fetchSalesReport();
        if (activeTab === 'purchases') fetchPurchasesReport();
    }, [activeTab, fetchStockValuation, fetchSalesReport, fetchPurchasesReport]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
                setIsProductListOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredProducts = useMemo(() => {
        const search = productSearch.toLowerCase().trim();
        if (!search) return products.slice(0, 50);
        return products.filter(p =>
            p.name.toLowerCase().includes(search) ||
            p.sku?.toLowerCase().includes(search)
        ).slice(0, 50);
    }, [products, productSearch]);

    const stockColumns: ColumnDef<any>[] = [
        { accessorKey: 'sku', header: 'SKU', cell: ({ row }) => <span className="font-mono">{row.original.sku}</span> },
        { accessorKey: 'name', header: 'Product Name', cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
        { accessorKey: 'stockQuantity', header: 'Current Stock' },
        { accessorKey: 'purchasePrice', header: 'Purchase Price', cell: ({ row }) => <>৳{row.original.purchasePrice.toLocaleString()}</> },
        { accessorKey: 'value', header: 'Inventory Value', cell: ({ row }) => <span className="font-bold text-slate-900">৳{row.original.value.toLocaleString()}</span> },
    ];

    const salesColumns: ColumnDef<any>[] = [
        { accessorKey: 'date', header: 'Date', cell: ({ row }) => format(new Date(row.original.date), 'dd/MM/yyyy') },
        { accessorKey: 'invoiceNo', header: 'Invoice #', cell: ({ row }) => <span className="font-mono">{row.original.invoiceNo}</span> },
        { accessorKey: 'productSKU', header: 'SKU', cell: ({ row }) => <span className="font-mono text-xs">{row.original.productSKU}</span> },
        { accessorKey: 'productName', header: 'Product', cell: ({ row }) => <span className="font-medium">{row.original.productName}</span> },
        { accessorKey: 'quantity', header: 'Qty' },
        { accessorKey: 'unitPrice', header: 'Unit Price', cell: ({ row }) => <>৳{row.original.unitPrice.toLocaleString()}</> },
        { accessorKey: 'total', header: 'Total Value', cell: ({ row }) => <span className="font-bold text-emerald-600">৳{row.original.total.toLocaleString()}</span> },
    ];

    const purchaseColumns: ColumnDef<any>[] = [
        { accessorKey: 'date', header: 'Date', cell: ({ row }) => format(new Date(row.original.date), 'dd/MM/yyyy') },
        { accessorKey: 'purchaseNo', header: 'Purchase #', cell: ({ row }) => <span className="font-mono">{row.original.purchaseNo}</span> },
        { accessorKey: 'productSKU', header: 'SKU', cell: ({ row }) => <span className="font-mono text-xs">{row.original.productSKU}</span> },
        { accessorKey: 'productName', header: 'Product', cell: ({ row }) => <span className="font-medium">{row.original.productName}</span> },
        { accessorKey: 'quantity', header: 'Qty' },
        { accessorKey: 'unitCost', header: 'Unit Cost', cell: ({ row }) => <>৳{row.original.unitCost.toLocaleString()}</> },
        { accessorKey: 'total', header: 'Total Value', cell: ({ row }) => <span className="font-bold text-blue-600">৳{row.original.total.toLocaleString()}</span> },
    ];

    return (
        <div className="space-y-4 flex flex-col h-full">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Business Reports</h2>
                    <p className="text-sm text-muted-foreground">Comprehensive analytics for your business operations.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                    <Download className="mr-2 h-4 w-4" /> Export PDF
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 space-y-4">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shrink-0">
                    <TabsList className="shrink-0">
                        <TabsTrigger value="stock">Stock Valuation</TabsTrigger>
                        <TabsTrigger value="sales">Sales Report</TabsTrigger>
                        <TabsTrigger value="purchases">Purchase Report</TabsTrigger>
                    </TabsList>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Searchable Product Dropdown */}
                        <div className="relative w-64" ref={productDropdownRef}>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Filter by Product..."
                                    className="pl-9 h-9 border-slate-200"
                                    value={isProductListOpen ? productSearch : selectedProductName}
                                    onChange={(e) => {
                                        setProductSearch(e.target.value);
                                        setIsProductListOpen(true);
                                    }}
                                    onFocus={() => {
                                        setIsProductListOpen(true);
                                        setProductSearch('');
                                    }}
                                />
                                {productId !== 'All' && (
                                    <button 
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        onClick={() => {
                                            setProductId('All');
                                            setSelectedProductName('All Products');
                                            setProductSearch('');
                                        }}
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            {isProductListOpen && (
                                <div className="absolute top-full left-0 w-80 bg-white border rounded-lg shadow-xl mt-1 z-50 overflow-hidden max-h-80 overflow-y-auto">
                                    <div 
                                        className="p-2 hover:bg-slate-50 cursor-pointer text-sm border-b font-bold text-slate-500"
                                        onClick={() => {
                                            setProductId('All');
                                            setSelectedProductName('All Products');
                                            setIsProductListOpen(false);
                                        }}
                                    >
                                        All Products
                                    </div>
                                    {filteredProducts.length === 0 ? (
                                        <div className="p-4 text-center text-slate-400 text-sm">No products found</div>
                                    ) : (
                                        filteredProducts.map((p) => (
                                            <div
                                                key={p.id}
                                                className="p-2 hover:bg-blue-50 cursor-pointer border-b last:border-0 flex flex-col"
                                                onClick={() => {
                                                    setProductId(p.id.toString());
                                                    setSelectedProductName(p.name);
                                                    setIsProductListOpen(false);
                                                }}
                                            >
                                                <span className="text-sm font-medium">{p.name}</span>
                                                <span className="text-[10px] text-slate-400 font-mono">{p.sku}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                        
                        {(activeTab === 'sales' || activeTab === 'purchases') && (
                            <>
                                <CustomDatePicker
                                    value={startDate}
                                    onChange={setStartDate}
                                    className="w-32"
                                    placeholder="From"
                                />
                                <CustomDatePicker
                                    value={endDate}
                                    onChange={setEndDate}
                                    className="w-32"
                                    placeholder="To"
                                />
                            </>
                        )}

                        <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-slate-400 hover:text-slate-900 h-9 px-2"
                            onClick={() => {
                                setProductId('All');
                                setSelectedProductName('All Products');
                                setProductSearch('');
                                setStartDate('');
                                setEndDate('');
                            }}
                        >
                            Reset
                        </Button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                    <TabsContent value="stock" forceMount className={activeTab !== 'stock' ? 'hidden' : "flex-1 flex flex-col min-h-0 m-0 outline-none"}>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 shrink-0">
                            <Card className="bg-slate-900 text-white border-none shadow-sm overflow-hidden">
                                <CardHeader className="p-3 pb-0">
                                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex justify-between items-center">
                                        Inventory Value
                                        <CircleDollarSign size={14} className="text-emerald-400" />
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 pt-1">
                                    <div className="text-xl font-black italic">৳{stockTotal.toLocaleString()}</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-white border-slate-200 shadow-sm">
                                <CardHeader className="p-3 pb-0">
                                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex justify-between items-center">
                                        Unique Products
                                        <Package size={14} className="text-blue-500" />
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 pt-1">
                                    <div className="text-xl font-bold text-slate-900">{stockCount.toLocaleString()}</div>
                                </CardContent>
                            </Card>
                        </div>
                        <DataTable
                            columns={stockColumns}
                            data={stockData}
                            loading={loading}
                            manualPagination
                            pageCount={Math.ceil(stockCount / stockPagination.pageSize)}
                            pagination={stockPagination}
                            setPagination={setStockPagination}
                            totalCount={stockCount}
                        />
                    </TabsContent>

                    <TabsContent value="sales" forceMount className={activeTab !== 'sales' ? 'hidden' : "flex-1 flex flex-col min-h-0 m-0 outline-none"}>
                         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 shrink-0">
                            <Card className="bg-emerald-600 text-white border-none shadow-sm">
                                <CardHeader className="p-3 pb-0">
                                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-emerald-100 flex justify-between items-center">
                                        Total Sales
                                        <TrendingUp size={14} className="text-white" />
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 pt-1">
                                    <div className="text-xl font-black italic">৳{salesTotal.toLocaleString()}</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-white border-slate-200 shadow-sm">
                                <CardHeader className="p-3 pb-0">
                                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex justify-between items-center">
                                        Sale Items
                                        <ArrowUpRight size={14} className="text-emerald-500" />
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 pt-1">
                                    <div className="text-xl font-bold text-slate-900">{salesCount.toLocaleString()}</div>
                                </CardContent>
                            </Card>
                        </div>
                        <DataTable
                            columns={salesColumns}
                            data={salesData}
                            loading={loading}
                            manualPagination
                            pageCount={Math.ceil(salesCount / salesPagination.pageSize)}
                            pagination={salesPagination}
                            setPagination={setSalesPagination}
                            totalCount={salesCount}
                        />
                    </TabsContent>

                    <TabsContent value="purchases" forceMount className={activeTab !== 'purchases' ? 'hidden' : "flex-1 flex flex-col min-h-0 m-0 outline-none"}>
                         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 shrink-0">
                            <Card className="bg-blue-600 text-white border-none shadow-sm">
                                <CardHeader className="p-3 pb-0">
                                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-blue-100 flex justify-between items-center">
                                        Total Purchase
                                        <TrendingDown size={14} className="text-white" />
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 pt-1">
                                    <div className="text-xl font-black italic">৳{purchasesTotal.toLocaleString()}</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-white border-slate-200 shadow-sm">
                                <CardHeader className="p-3 pb-0">
                                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex justify-between items-center">
                                        Purchase Items
                                        <ArrowDownRight size={14} className="text-blue-500" />
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 pt-1">
                                    <div className="text-xl font-bold text-slate-900">{purchasesCount.toLocaleString()}</div>
                                </CardContent>
                            </Card>
                        </div>
                        <DataTable
                            columns={purchaseColumns}
                            data={purchasesData}
                            loading={loading}
                            manualPagination
                            pageCount={Math.ceil(purchasesCount / purchasesPagination.pageSize)}
                            pagination={purchasesPagination}
                            setPagination={setPurchasesPagination}
                            totalCount={purchasesCount}
                        />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
