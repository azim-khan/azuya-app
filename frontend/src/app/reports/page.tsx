'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import api from '@/services/api';
import {
    Search,
    TrendingUp,
    TrendingDown,
    Package,
    ArrowUpRight,
    ArrowDownRight,
    CircleDollarSign,
    X,
    Filter,
    BarChart3
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { CustomDatePicker } from '@/components/ui/custom-date-picker';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState('stock');
    const [salesTab, setSalesTab] = useState('summary');
    const [purchasesTab, setPurchasesTab] = useState('summary');
    const [profitTab, setProfitTab] = useState('product');

    const [loading, setLoading] = useState(false);

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('All');

    // Product Search Dropdown States
    const [productId, setProductId] = useState('All');
    const [productSearch, setProductSearch] = useState('');
    const [isProductListOpen, setIsProductListOpen] = useState(false);
    const [selectedProductName, setSelectedProductName] = useState('All Products');
    const [products, setProducts] = useState<any[]>([]);
    const productDropdownRef = useRef<HTMLDivElement>(null);

    // Customer Search
    const [customerId, setCustomerId] = useState('All');
    const [customers, setCustomers] = useState<any[]>([]);

    // Supplier Search
    const [supplierId, setSupplierId] = useState('All');
    const [suppliers, setSuppliers] = useState<any[]>([]);

    // Data states
    const [data, setData] = useState<any[]>([]);
    const [count, setCount] = useState(0);
    const [summaryStats, setSummaryStats] = useState<any>({});
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });

    const fetchDropdownData = useCallback(async () => {
        try {
            const [prodRes, custRes, supRes] = await Promise.all([
                api.get('/products?pageSize=1000'),
                api.get('/customers?pageSize=1000'),
                api.get('/suppliers?pageSize=1000')
            ]);
            setProducts(prodRes.data.data || []);
            setCustomers(Array.isArray(custRes.data) ? custRes.data : (custRes.data.data || []));
            setSuppliers(Array.isArray(supRes.data) ? supRes.data : (supRes.data.data || []));
        } catch (error) {
            console.error('Failed to fetch dropdown data:', error);
        }
    }, []);

    useEffect(() => {
        fetchDropdownData();
    }, [fetchDropdownData]);

    // Reset page to 1 when filters change
    useEffect(() => {
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    }, [activeTab, salesTab, purchasesTab, profitTab, startDate, endDate, productId, customerId, supplierId, paymentStatus]);

    const fetchReportData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                pageIndex: (pagination.pageIndex + 1).toString(),
                pageSize: pagination.pageSize.toString(),
            });

            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            if (productId !== 'All') params.append('productId', productId);
            if (customerId !== 'All') params.append('customerId', customerId);
            if (supplierId !== 'All') params.append('supplierId', supplierId);
            if (paymentStatus !== 'All') params.append('paymentStatus', paymentStatus);

            let endpoint = '';

            if (activeTab === 'stock') {
                endpoint = '/reports/stock-valuation';
            } else if (activeTab === 'sales') {
                if (salesTab === 'summary') endpoint = '/reports/sales-summary';
                if (salesTab === 'product') endpoint = '/reports/sales/by-product';
                if (salesTab === 'customer') endpoint = '/reports/sales/by-customer';
            } else if (activeTab === 'purchases') {
                if (purchasesTab === 'summary') endpoint = '/reports/purchases-summary';
                if (purchasesTab === 'product') endpoint = '/reports/purchases/by-product';
                if (purchasesTab === 'supplier') endpoint = '/reports/purchases/by-supplier';
            } else if (activeTab === 'profitability') {
                if (profitTab === 'product') endpoint = '/reports/profit/by-product';
                if (profitTab === 'margin') endpoint = '/reports/profit/margins';
            }

            const res = await api.get(`${endpoint}?${params}`);
            setData(res.data.data);
            setCount(res.data.count);

            // Extract summary stats dynamically
            const { data: _, pageIndex, pageSize, count: __, ...rest } = res.data;
            setSummaryStats(rest);

        } catch (error) {
            console.error('Failed to fetch report data:', error);
            setData([]);
            setCount(0);
            setSummaryStats({});
        } finally {
            setLoading(false);
        }
    }, [pagination, activeTab, salesTab, purchasesTab, profitTab, startDate, endDate, productId, customerId, supplierId, paymentStatus]);

    useEffect(() => {
        fetchReportData();
    }, [fetchReportData]);

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

    // Columns Definitions
    const stockColumns: ColumnDef<any>[] = [
        { accessorKey: 'sku', header: 'SKU', cell: ({ row }) => <span className="font-mono">{row.original.sku}</span> },
        { accessorKey: 'name', header: 'Product Name', cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
        { accessorKey: 'stockQuantity', header: 'Current Stock' },
        { accessorKey: 'purchasePrice', header: 'Purchase Price', cell: ({ row }) => <>৳{row.original.purchasePrice?.toLocaleString() ?? 0}</> },
        { accessorKey: 'value', header: 'Inventory Value', cell: ({ row }) => <span className="font-bold text-slate-900">৳{row.original.value?.toLocaleString() ?? 0}</span> },
    ];

    const salesSummaryColumns: ColumnDef<any>[] = [
        { accessorKey: 'date', header: 'Date', cell: ({ row }) => row.original.date ? format(new Date(row.original.date), 'dd/MM/yyyy') : 'N/A' },
        { accessorKey: 'invoiceNo', header: 'Invoice #', cell: ({ row }) => <span className="font-mono">{row.original.invoiceNo}</span> },
        { accessorKey: 'customerName', header: 'Customer', cell: ({ row }) => <span className="font-medium">{row.original.customerName}</span> },
        { accessorKey: 'totalAmount', header: 'Total', cell: ({ row }) => <span className="font-bold text-emerald-600">৳{row.original.totalAmount?.toLocaleString() ?? 0}</span> },
        { accessorKey: 'paidAmount', header: 'Paid', cell: ({ row }) => <>৳{row.original.paidAmount?.toLocaleString() ?? 0}</> },
        { accessorKey: 'dueAmount', header: 'Due', cell: ({ row }) => <span className={(row.original.dueAmount || 0) > 0 ? "text-red-500 font-bold" : ""}>৳{row.original.dueAmount?.toLocaleString() ?? 0}</span> },
        { accessorKey: 'paymentStatus', header: 'Status' },
    ];

    const salesByProductColumns: ColumnDef<any>[] = [
        { accessorKey: 'sku', header: 'SKU', cell: ({ row }) => <span className="font-mono">{row.original.sku}</span> },
        { accessorKey: 'productName', header: 'Product', cell: ({ row }) => <span className="font-medium">{row.original.productName}</span> },
        { accessorKey: 'quantitySold', header: 'Qty Sold' },
        { accessorKey: 'totalRevenue', header: 'Total Revenue', cell: ({ row }) => <span className="font-bold text-emerald-600">৳{row.original.totalRevenue?.toLocaleString() ?? 0}</span> },
    ];

    const salesByCustomerColumns: ColumnDef<any>[] = [
        { accessorKey: 'customerName', header: 'Customer Name', cell: ({ row }) => <span className="font-medium">{row.original.customerName}</span> },
        { accessorKey: 'invoiceCount', header: 'Invoices' },
        { accessorKey: 'totalAmount', header: 'Total Sales', cell: ({ row }) => <span className="font-bold text-emerald-600">৳{row.original.totalAmount?.toLocaleString() ?? 0}</span> },
        { accessorKey: 'paidAmount', header: 'Total Paid', cell: ({ row }) => <>৳{row.original.paidAmount?.toLocaleString() ?? 0}</> },
        { accessorKey: 'dueAmount', header: 'Total Due', cell: ({ row }) => <span className={(row.original.dueAmount || 0) > 0 ? "text-red-500 font-bold" : ""}>৳{row.original.dueAmount?.toLocaleString() ?? 0}</span> },
    ];

    const purchasesSummaryColumns: ColumnDef<any>[] = [
        { accessorKey: 'date', header: 'Date', cell: ({ row }) => row.original.date ? format(new Date(row.original.date), 'dd/MM/yyyy') : 'N/A' },
        { accessorKey: 'purchaseNo', header: 'Purchase #', cell: ({ row }) => <span className="font-mono">{row.original.purchaseNo}</span> },
        { accessorKey: 'supplierName', header: 'Supplier', cell: ({ row }) => <span className="font-medium">{row.original.supplierName}</span> },
        { accessorKey: 'totalAmount', header: 'Total', cell: ({ row }) => <span className="font-bold text-blue-600">৳{row.original.totalAmount?.toLocaleString() ?? 0}</span> },
        { accessorKey: 'paidAmount', header: 'Paid', cell: ({ row }) => <>৳{row.original.paidAmount?.toLocaleString() ?? 0}</> },
        { accessorKey: 'dueAmount', header: 'Due', cell: ({ row }) => <span className={(row.original.dueAmount || 0) > 0 ? "text-red-500 font-bold" : ""}>৳{row.original.dueAmount?.toLocaleString() ?? 0}</span> },
        { accessorKey: 'paymentStatus', header: 'Status' },
    ];

    const purchasesByProductColumns: ColumnDef<any>[] = [
        { accessorKey: 'sku', header: 'SKU', cell: ({ row }) => <span className="font-mono">{row.original.sku}</span> },
        { accessorKey: 'productName', header: 'Product', cell: ({ row }) => <span className="font-medium">{row.original.productName}</span> },
        { accessorKey: 'quantityPurchased', header: 'Qty Purchased' },
        { accessorKey: 'totalCost', header: 'Total Cost', cell: ({ row }) => <span className="font-bold text-blue-600">৳{row.original.totalCost?.toLocaleString() ?? 0}</span> },
    ];

    const purchasesBySupplierColumns: ColumnDef<any>[] = [
        { accessorKey: 'supplierName', header: 'Supplier Name', cell: ({ row }) => <span className="font-medium">{row.original.supplierName}</span> },
        { accessorKey: 'invoiceCount', header: 'Invoices' },
        { accessorKey: 'totalAmount', header: 'Total Purchases', cell: ({ row }) => <span className="font-bold text-blue-600">৳{row.original.totalAmount?.toLocaleString() ?? 0}</span> },
        { accessorKey: 'paidAmount', header: 'Total Paid', cell: ({ row }) => <>৳{row.original.paidAmount?.toLocaleString() ?? 0}</> },
        { accessorKey: 'dueAmount', header: 'Total Due', cell: ({ row }) => <span className={(row.original.dueAmount || 0) > 0 ? "text-red-500 font-bold" : ""}>৳{row.original.dueAmount?.toLocaleString() ?? 0}</span> },
    ];

    const profitPerProductColumns: ColumnDef<any>[] = [
        { accessorKey: 'sku', header: 'SKU', cell: ({ row }) => <span className="font-mono">{row.original.sku}</span> },
        { accessorKey: 'productName', header: 'Product', cell: ({ row }) => <span className="font-medium">{row.original.productName}</span> },
        { accessorKey: 'quantitySold', header: 'Qty Sold' },
        { accessorKey: 'totalRevenue', header: 'Revenue', cell: ({ row }) => <>৳{row.original.totalRevenue?.toLocaleString() ?? 0}</> },
        { accessorKey: 'totalCost', header: 'Cost', cell: ({ row }) => <>৳{row.original.totalCost?.toLocaleString() ?? 0}</> },
        { accessorKey: 'totalProfit', header: 'Profit', cell: ({ row }) => <span className="font-bold text-green-600">৳{row.original.totalProfit?.toLocaleString() ?? 0}</span> },
    ];

    const profitMarginsColumns: ColumnDef<any>[] = [
        { accessorKey: 'sku', header: 'SKU', cell: ({ row }) => <span className="font-mono">{row.original.sku}</span> },
        { accessorKey: 'name', header: 'Product', cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
        { accessorKey: 'purchasePrice', header: 'Purchase Price', cell: ({ row }) => <>৳{row.original.purchasePrice?.toLocaleString() ?? 0}</> },
        { accessorKey: 'salePrice', header: 'Sale Price', cell: ({ row }) => <>৳{row.original.salePrice?.toLocaleString() ?? 0}</> },
        { accessorKey: 'profitPerUnit', header: 'Profit/Unit', cell: ({ row }) => <>৳{row.original.profitPerUnit?.toLocaleString() ?? 0}</> },
        { accessorKey: 'margin', header: 'Margin %', cell: ({ row }) => <span className="font-bold text-green-600">{(row.original.margin || 0).toFixed(2)}%</span> },
    ];

    // Determine current columns based on active tab and sub tab
    let currentColumns: ColumnDef<any>[] = [];
    if (activeTab === 'stock') currentColumns = stockColumns;
    if (activeTab === 'sales') {
        if (salesTab === 'summary') currentColumns = salesSummaryColumns;
        if (salesTab === 'product') currentColumns = salesByProductColumns;
        if (salesTab === 'customer') currentColumns = salesByCustomerColumns;
    }
    if (activeTab === 'purchases') {
        if (purchasesTab === 'summary') currentColumns = purchasesSummaryColumns;
        if (purchasesTab === 'product') currentColumns = purchasesByProductColumns;
        if (purchasesTab === 'supplier') currentColumns = purchasesBySupplierColumns;
    }
    if (activeTab === 'profitability') {
        if (profitTab === 'product') currentColumns = profitPerProductColumns;
        if (profitTab === 'margin') currentColumns = profitMarginsColumns;
    }

    return (
        <div className="space-y-4 flex flex-col h-full">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Business Reports</h2>
                    <p className="text-sm text-muted-foreground">Comprehensive analytics for your business operations.</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={(val) => {
                setActiveTab(val);
                setData([]);
                setPagination({ pageIndex: 0, pageSize: 50 });
            }} className="flex-1 flex flex-col min-h-0 space-y-4">

                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shrink-0">
                    <TabsList className="shrink-0 bg-slate-100 border p-1 rounded-lg">
                        <TabsTrigger value="stock" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 text-xs uppercase tracking-widest font-bold">Stock</TabsTrigger>
                        <TabsTrigger value="sales" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 text-xs uppercase tracking-widest font-bold">Sales</TabsTrigger>
                        <TabsTrigger value="purchases" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 text-xs uppercase tracking-widest font-bold">Purchases</TabsTrigger>
                        <TabsTrigger value="profitability" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 text-xs uppercase tracking-widest font-bold">Profitability</TabsTrigger>
                    </TabsList>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Searchable Product Dropdown */}
                        {(activeTab === 'stock' ||
                            (activeTab === 'sales' && salesTab === 'product') ||
                            (activeTab === 'purchases' && purchasesTab === 'product') ||
                            (activeTab === 'profitability')) && (
                                <div className="relative w-48" ref={productDropdownRef}>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            placeholder="Product..."
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
                            )}

                        {(activeTab === 'sales' && (salesTab === 'summary' || salesTab === 'customer')) && (
                            <Select value={customerId} onValueChange={setCustomerId}>
                                <SelectTrigger className="w-48 h-9 border-slate-200">
                                    <SelectValue placeholder="All Customers" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Customers</SelectItem>
                                    {customers?.map(c => (
                                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {(activeTab === 'purchases' && (purchasesTab === 'summary' || purchasesTab === 'supplier')) && (
                            <Select value={supplierId} onValueChange={setSupplierId}>
                                <SelectTrigger className="w-48 h-9 border-slate-200">
                                    <SelectValue placeholder="All Suppliers" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Suppliers</SelectItem>
                                    {suppliers?.map(s => (
                                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {((activeTab === 'sales' && salesTab === 'summary') || (activeTab === 'purchases' && purchasesTab === 'summary')) && (
                            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                                <SelectTrigger className="w-32 h-9 border-slate-200">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Statuses</SelectItem>
                                    <SelectItem value="Paid">Paid</SelectItem>
                                    <SelectItem value="Partial">Partial</SelectItem>
                                    <SelectItem value="Due">Due</SelectItem>
                                </SelectContent>
                            </Select>
                        )}

                        {activeTab !== 'stock' && profitTab !== 'margin' && (
                            <>
                                <CustomDatePicker
                                    value={startDate}
                                    onChange={setStartDate}
                                    className="w-32 h-9"
                                    placeholder="From Date"
                                />
                                <CustomDatePicker
                                    value={endDate}
                                    onChange={setEndDate}
                                    className="w-32 h-9"
                                    placeholder="To Date"
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
                                setCustomerId('All');
                                setSupplierId('All');
                                setPaymentStatus('All');
                                setStartDate('');
                                setEndDate('');
                            }}
                        >
                            Reset
                        </Button>
                    </div>
                </div>

                {/* Sub Navigation based on Active Tab */}
                {activeTab === 'sales' && (
                    <div className="flex gap-2 shrink-0 border-b pb-2">
                        <Button variant={salesTab === 'summary' ? 'default' : 'outline'} size="sm" onClick={() => { setSalesTab('summary'); setData([]); }}>Summary</Button>
                        <Button variant={salesTab === 'product' ? 'default' : 'outline'} size="sm" onClick={() => { setSalesTab('product'); setData([]); }}>By Product</Button>
                        <Button variant={salesTab === 'customer' ? 'default' : 'outline'} size="sm" onClick={() => { setSalesTab('customer'); setData([]); }}>By Customer</Button>
                    </div>
                )}
                {activeTab === 'purchases' && (
                    <div className="flex gap-2 shrink-0 border-b pb-2">
                        <Button variant={purchasesTab === 'summary' ? 'default' : 'outline'} size="sm" onClick={() => { setPurchasesTab('summary'); setData([]); }}>Summary</Button>
                        <Button variant={purchasesTab === 'product' ? 'default' : 'outline'} size="sm" onClick={() => { setPurchasesTab('product'); setData([]); }}>By Product</Button>
                        <Button variant={purchasesTab === 'supplier' ? 'default' : 'outline'} size="sm" onClick={() => { setPurchasesTab('supplier'); setData([]); }}>By Supplier</Button>
                    </div>
                )}
                {activeTab === 'profitability' && (
                    <div className="flex gap-2 shrink-0 border-b pb-2">
                        <Button variant={profitTab === 'product' ? 'default' : 'outline'} size="sm" onClick={() => { setProfitTab('product'); setData([]); }}>Profit Per Product</Button>
                        <Button variant={profitTab === 'margin' ? 'default' : 'outline'} size="sm" onClick={() => { setProfitTab('margin'); setData([]); }}>Margin Analysis</Button>
                    </div>
                )}

                <div className="shrink-0 space-y-4">
                    {/* Dynamic Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {summaryStats?.totalValue !== undefined && (
                            <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Total Value</p>
                                        <p className="text-2xl font-black">৳{summaryStats.totalValue.toLocaleString()}</p>
                                    </div>
                                    <div className="p-3 bg-white/10 rounded-xl">
                                        <Package className="h-5 w-5 text-white" />
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        {summaryStats?.totalRevenue !== undefined && (
                            <Card className="border-none shadow-sm bg-emerald-600 text-white overflow-hidden">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Total Revenue</p>
                                        <p className="text-2xl font-black">৳{summaryStats.totalRevenue.toLocaleString()}</p>
                                    </div>
                                    <div className="p-3 bg-white/10 rounded-xl">
                                        <ArrowUpRight className="h-5 w-5 text-white" />
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        {summaryStats?.totalCost !== undefined && (
                            <Card className="border-none shadow-sm bg-blue-600 text-white overflow-hidden">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Total Cost</p>
                                        <p className="text-2xl font-black">৳{summaryStats.totalCost.toLocaleString()}</p>
                                    </div>
                                    <div className="p-3 bg-white/10 rounded-xl">
                                        <ArrowDownRight className="h-5 w-5 text-white" />
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        {summaryStats?.totalProfit !== undefined && (
                            <Card className="border-none shadow-sm bg-violet-600 text-white overflow-hidden">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Total Profit</p>
                                        <p className="text-2xl font-black">৳{summaryStats.totalProfit.toLocaleString()}</p>
                                    </div>
                                    <div className="p-3 bg-white/10 rounded-xl">
                                        <TrendingUp className="h-5 w-5 text-white" />
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        {summaryStats?.totalPaid !== undefined && (
                            <Card className="border-none shadow-sm bg-indigo-500 text-white overflow-hidden">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Total Paid</p>
                                        <p className="text-2xl font-black">৳{summaryStats.totalPaid.toLocaleString()}</p>
                                    </div>
                                    <div className="p-3 bg-white/10 rounded-xl">
                                        <CircleDollarSign className="h-5 w-5 text-white" />
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        {summaryStats?.totalDue !== undefined && (
                            <Card className="border-none shadow-sm bg-rose-500 text-white overflow-hidden">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Total Due</p>
                                        <p className="text-2xl font-black">৳{summaryStats.totalDue.toLocaleString()}</p>
                                    </div>
                                    <div className="p-3 bg-white/10 rounded-xl">
                                        <TrendingDown className="h-5 w-5 text-white" />
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        {summaryStats?.avgMargin !== undefined && (
                            <Card className="border-none shadow-sm bg-amber-500 text-white overflow-hidden">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Avg Margin</p>
                                        <p className="text-2xl font-black">{summaryStats.avgMargin.toFixed(1)}%</p>
                                    </div>
                                    <div className="p-3 bg-white/10 rounded-xl">
                                        <BarChart3 className="h-5 w-5 text-white" />
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0 overflow-hidden mt-4">
                    <div className="flex-1 flex flex-col p-0 overflow-hidden">
                        <DataTable
                            columns={currentColumns}
                            data={data}
                            loading={loading}
                            manualPagination
                            pageCount={Math.ceil(count / pagination.pageSize)}
                            pagination={pagination}
                            setPagination={setPagination}
                            totalCount={count}
                        />
                    </div>
                </div>
            </Tabs>
        </div>
    );
}
