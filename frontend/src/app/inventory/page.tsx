'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import api from '@/services/api';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { CategoryDialog } from '@/components/inventory/CategoryDialog';
import { UnitDialog } from '@/components/inventory/UnitDialog';
import { ProductDialog } from '@/components/inventory/ProductDialog';
import { BrandDialog } from '@/components/inventory/BrandDialog';
import { DataTable } from '@/components/ui/data-table';
import { useDataTable } from '@/hooks/use-data-table';
import { ColumnDef } from '@tanstack/react-table';

// Interfaces
interface Product {
    id: number;
    name: string;
    sku: string;
    categoryName: string;
    categoryId: number;
    unitName: string;
    unitId: number;
    brandName?: string;
    brandId?: number;
    model?: string;
    stockQuantity: number;
    salePrice: number;
    purchasePrice: number;
}
interface Category { id: number; name: string; code: string; description: string; }
interface Unit { id: number; name: string; symbol: string; }
interface Brand { id: number; name: string; description: string; }

export default function Inventory() {
    const [activeTab, setActiveTab] = useState('products');
    const [categories, setCategories] = useState<Category[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);

    // Use our new generic hook for products
    const {
        data: products,
        loading,
        totalCount: productCount,
        pagination: productPagination,
        setPagination: setProductPagination,
        sorting: productSorting,
        setSorting: setProductSorting,
        filters,
        updateFilter,
        refresh: fetchProducts
    } = useDataTable<Product>({
        endpoint: '/products',
        initialFilters: { search: '' }
    });

    const productSearch = (filters.search as string) || '';

    // Client-side local filtering state
    const [categorySearch, setCategorySearch] = useState('');
    const [unitSearch, setUnitSearch] = useState('');
    const [brandSearch, setBrandSearch] = useState('');

    // Dialog States
    const [showProductDialog, setShowProductDialog] = useState(false);
    const [showCategoryDialog, setShowCategoryDialog] = useState(false);
    const [showUnitDialog, setShowUnitDialog] = useState(false);
    const [showBrandDialog, setShowBrandDialog] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    // Fetch non-paginated data manually or we could use useDataTable for them too
    const fetchOtherData = useCallback(async () => {
        try {
            if (activeTab === 'categories') {
                const res = await api.get('/categories');
                setCategories(res.data);
            } else if (activeTab === 'units') {
                const res = await api.get('/units');
                setUnits(res.data);
            } else if (activeTab === 'brands') {
                const res = await api.get('/brands');
                setBrands(res.data);
            }
        } catch (err) {
            console.error(err);
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab !== 'products') {
            fetchOtherData();
        }
    }, [activeTab, fetchOtherData]);

    const handleEdit = (item: any, type: 'product' | 'category' | 'unit' | 'brand') => {
        setEditingItem(item);
        if (type === 'product') setShowProductDialog(true);
        if (type === 'category') setShowCategoryDialog(true);
        if (type === 'unit') setShowUnitDialog(true);
        if (type === 'brand') setShowBrandDialog(true);
    };

    const handleAdd = (type: 'product' | 'category' | 'unit' | 'brand') => {
        setEditingItem(null);
        if (type === 'product') setShowProductDialog(true);
        if (type === 'category') setShowCategoryDialog(true);
        if (type === 'unit') setShowUnitDialog(true);
        if (type === 'brand') setShowBrandDialog(true);
    };

    const handleDelete = async (id: number, type: 'product' | 'category' | 'unit' | 'brand') => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        try {
            const endpoint = 
                type === 'product' ? `/products/${id}` :
                type === 'category' ? `/categories/${id}` :
                type === 'unit' ? `/units/${id}` :
                `/brands/${id}`;
            
            await api.delete(endpoint);
            
            // For products (paginated), refresh from server or adjust page
            if (type === 'product') {
                if (products.length === 1 && productPagination.pageIndex > 0) {
                    setProductPagination(prev => ({ ...prev, pageIndex: prev.pageIndex - 1 }));
                } else {
                    await fetchProducts();
                }
            } else {
                // For other entities, update local state immediately for a snapier feel
                if (type === 'category') setCategories(prev => prev.filter(item => item.id !== id));
                if (type === 'unit') setUnits(prev => prev.filter(item => item.id !== id));
                if (type === 'brand') setBrands(prev => prev.filter(item => item.id !== id));
            }
        } catch (err: any) {
            const message = err.response?.data || "An error occurred while deleting the item.";
            alert(message);
        }
    };

    // Columns Definitions
    const productColumns = useMemo<ColumnDef<Product>[]>(
        () => [
            { accessorKey: 'name', header: 'Name' },
            { accessorKey: 'sku', header: 'SKU' },
            { accessorKey: 'categoryName', header: 'Category' },
            { accessorKey: 'brandName', header: 'Brand', cell: info => info.getValue() || '-' },
            { accessorKey: 'model', header: 'Model', cell: info => info.getValue() || '-' },
            { accessorKey: 'unitName', header: 'Unit', enableSorting: false },
            { accessorKey: 'salePrice', header: 'Price', cell: info => `$${(info.getValue() as number).toFixed(2)}` },
            { accessorKey: 'stockQuantity', header: 'Stock' },
            {
                id: 'status',
                header: 'Status',
                enableSorting: false,
                cell: ({ row }) => {
                    const stock = row.original.stockQuantity;
                    return stock < 10
                        ? <span className="text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-bold">Low Stock</span>
                        : <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-bold">In Stock</span>
                }
            },
            {
                id: 'actions',
                header: () => <div className="text-right">Actions</div>,
                enableSorting: false,
                cell: ({ row }) => (
                    <div className="text-right flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original, 'product')}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(row.original.id, 'product')}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ),
            }
        ],
        [handleEdit, handleDelete]
    );

    const categoryColumns = useMemo<ColumnDef<Category>[]>(
        () => [
            { accessorKey: 'name', header: 'Name' },
            { accessorKey: 'code', header: 'Code', cell: info => info.getValue() || '-' },
            { accessorKey: 'description', header: 'Description' },
            {
                id: 'actions',
                header: () => <div className="text-right">Actions</div>,
                enableSorting: false,
                cell: ({ row }) => (
                    <div className="text-right flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original, 'category')}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(row.original.id, 'category')}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ),
            }
        ],
        [handleEdit, handleDelete]
    );

    const unitColumns = useMemo<ColumnDef<Unit>[]>(
        () => [
            { accessorKey: 'name', header: 'Name' },
            { accessorKey: 'symbol', header: 'Symbol' },
            {
                id: 'actions',
                header: () => <div className="text-right">Actions</div>,
                enableSorting: false,
                cell: ({ row }) => (
                    <div className="text-right flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original, 'unit')}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(row.original.id, 'unit')}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ),
            }
        ],
        [handleEdit, handleDelete]
    );

    const brandColumns = useMemo<ColumnDef<Brand>[]>(
        () => [
            { accessorKey: 'name', header: 'Name' },
            { accessorKey: 'description', header: 'Description' },
            {
                id: 'actions',
                header: () => <div className="text-right">Actions</div>,
                enableSorting: false,
                cell: ({ row }) => (
                    <div className="text-right flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original, 'brand')}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(row.original.id, 'brand')}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ),
            }
        ],
        [handleEdit, handleDelete]
    );

    return (
        <div className="space-y-6 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between flex-none">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Inventory Management</h2>
                    <p className="text-muted-foreground">Manage products, categories, and units.</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 space-y-4">
                <TabsList>
                    <TabsTrigger value="products">Products</TabsTrigger>
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                    <TabsTrigger value="units">Units</TabsTrigger>
                    <TabsTrigger value="brands">Brands</TabsTrigger>
                </TabsList>

                {/* Products Tab */}
                <TabsContent value="products" className="data-[state=active]:flex-1 data-[state=active]:flex data-[state=active]:flex-col min-h-0 space-y-4">
                    <div className="flex justify-between items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input type="search" placeholder="Search products..." className="pl-8" defaultValue={productSearch} onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    updateFilter('search', e.currentTarget.value);
                                }
                            }} />
                        </div>
                        <Button onClick={() => handleAdd('product')}>
                            <Plus className="mr-2 h-4 w-4" /> Add Product
                        </Button>
                    </div>

                    <DataTable
                        columns={productColumns}
                        data={products}
                        loading={loading}
                        manualPagination={true}
                        manualSorting={true}
                        pageCount={Math.ceil(productCount / productPagination.pageSize)}
                        pagination={productPagination}
                        setPagination={setProductPagination}
                        sorting={productSorting}
                        setSorting={setProductSorting}
                        totalCount={productCount}
                    />
                </TabsContent>

                {/* Categories Tab */}
                <TabsContent value="categories" className="data-[state=active]:flex-1 data-[state=active]:flex data-[state=active]:flex-col min-h-0 space-y-4">
                    <div className="flex justify-between items-center">
                        <Input placeholder="Search categories..." className="max-w-sm" defaultValue={categorySearch} onKeyDown={e => {
                            if (e.key === 'Enter') setCategorySearch(e.currentTarget.value);
                        }} />
                        <Button onClick={() => handleAdd('category')}>
                            <Plus className="mr-2 h-4 w-4" /> Add Category
                        </Button>
                    </div>
                    <DataTable
                        columns={categoryColumns}
                        data={categories.filter(c => (c.name || '').toLowerCase().includes((categorySearch || '').toLowerCase()))}
                        loading={loading}
                    />
                </TabsContent>

                {/* Units Tab */}
                <TabsContent value="units" className="data-[state=active]:flex-1 data-[state=active]:flex data-[state=active]:flex-col min-h-0 space-y-4">
                    <div className="flex justify-between items-center">
                        <Input placeholder="Search units..." className="max-w-sm" defaultValue={unitSearch} onKeyDown={e => {
                            if (e.key === 'Enter') setUnitSearch(e.currentTarget.value);
                        }} />
                        <Button onClick={() => handleAdd('unit')}>
                            <Plus className="mr-2 h-4 w-4" /> Add Unit
                        </Button>
                    </div>
                    <DataTable
                        columns={unitColumns}
                        data={units.filter(u => (u.name || '').toLowerCase().includes((unitSearch || '').toLowerCase()))}
                        loading={loading}
                    />
                </TabsContent>

                {/* Brands Tab */}
                <TabsContent value="brands" className="data-[state=active]:flex-1 data-[state=active]:flex data-[state=active]:flex-col min-h-0 space-y-4">
                    <div className="flex justify-between items-center">
                        <Input placeholder="Search brands..." className="max-w-sm" defaultValue={brandSearch} onKeyDown={e => {
                            if (e.key === 'Enter') setBrandSearch(e.currentTarget.value);
                        }} />
                        <Button onClick={() => handleAdd('brand')}>
                            <Plus className="mr-2 h-4 w-4" /> Add Brand
                        </Button>
                    </div>
                    <DataTable
                        columns={brandColumns}
                        data={brands.filter(b => {
                            const search = (brandSearch || '').toLowerCase().trim();
                            if (!search) return true;
                            return (b.name || '').toLowerCase().includes(search) || 
                                   (b.description || '').toLowerCase().includes(search);
                        })}
                        loading={loading}
                    />
                </TabsContent>
            </Tabs>

            {/* Dialogs */}
            <ProductDialog open={showProductDialog} onOpenChange={setShowProductDialog} productToEdit={editingItem} onSave={fetchProducts} />
            <CategoryDialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog} categoryToEdit={editingItem} onSave={fetchOtherData} />
            <UnitDialog open={showUnitDialog} onOpenChange={setShowUnitDialog} unitToEdit={editingItem} onSave={fetchOtherData} />
            <BrandDialog open={showBrandDialog} onOpenChange={setShowBrandDialog} brandToEdit={editingItem} onSave={fetchOtherData} />
        </div>
    );
}
