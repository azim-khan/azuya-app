'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    categoryId: z.string().min(1, 'Category is required'),
    unitId: z.string().min(1, 'Unit is required'),
    brandId: z.string().optional(),
    model: z.string().optional(),
    purchasePrice: z.string(),
    salePrice: z.string(),
    stockQuantity: z.string(),
});

interface ProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    productToEdit?: any;
    onSave: () => void;
}

export function ProductDialog({ open, onOpenChange, productToEdit, onSave }: ProductDialogProps) {
    const { toast } = useToast();
    const [categories, setCategories] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            categoryId: '',
            unitId: '',
            brandId: '',
            model: '',
            purchasePrice: '0',
            salePrice: '0',
            stockQuantity: '0',
        },
    });

    useEffect(() => {
        fetchMasterData();
    }, []);

    const fetchMasterData = async () => {
        try {
            const [catRes, unitRes, brandRes] = await Promise.all([
                api.get('/categories'),
                api.get('/units'),
                api.get('/brands')
            ]);
            setCategories(catRes.data);
            setUnits(unitRes.data);
            setBrands(brandRes.data);
        } catch (err) {
            console.error("Failed to fetch master data", err);
        }
    };

    useEffect(() => {
        if (productToEdit) {
            form.reset({
                name: productToEdit.name,
                categoryId: String(productToEdit.categoryId || ''),
                unitId: String(productToEdit.unitId || ''),
                brandId: productToEdit.brandId ? String(productToEdit.brandId) : '',
                model: productToEdit.model || '',
                purchasePrice: String(productToEdit.purchasePrice || 0),
                salePrice: String(productToEdit.salePrice || 0),
                stockQuantity: String(productToEdit.stockQuantity || 0),
            });
        } else {
            form.reset({
                name: '',
                categoryId: '',
                unitId: '',
                brandId: '',
                model: '',
                purchasePrice: '0',
                salePrice: '0',
                stockQuantity: '0',
            });
        }
    }, [productToEdit, form, open]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const payload = {
                ...values,
                categoryId: Number(values.categoryId),
                unitId: Number(values.unitId),
                brandId: values.brandId ? Number(values.brandId) : null,
                model: values.model,
                purchasePrice: Number(values.purchasePrice),
                salePrice: Number(values.salePrice),
                stockQuantity: Number(values.stockQuantity),
            };

            if (productToEdit) {
                await api.put(`/products/${productToEdit.id}`, payload);
                toast({ title: 'Product updated successfully' });
            } else {
                await api.post('/products', payload);
                toast({ title: 'Product created successfully' });
            }
            onSave();
            onOpenChange(false);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data || 'Something went wrong',
                variant: 'destructive',
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{productToEdit ? 'Edit Product' : 'Add Product'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Product Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Product Name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="categoryId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Category" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {categories.map((c) => (
                                                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="unitId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Unit</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Unit" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {units.map((u) => (
                                                    <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="brandId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Brand</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Brand (Optional)" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {brands.map((b) => (
                                                    <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="model"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Model</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Model (Optional)" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="purchasePrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cost Price</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="salePrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sale Price</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="stockQuantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Initial Stock</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="submit">{productToEdit ? 'Save Changes' : 'Create Product'}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
