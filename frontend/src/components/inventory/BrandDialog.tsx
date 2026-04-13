'use client';

import { useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
});

interface BrandDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    brandToEdit?: any;
    onSave: () => void;
}

export function BrandDialog({ open, onOpenChange, brandToEdit, onSave }: BrandDialogProps) {
    const { toast } = useToast();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            description: '',
        },
    });

    useEffect(() => {
        if (brandToEdit) {
            form.reset({
                name: brandToEdit.name,
                description: brandToEdit.description || '',
            });
        } else {
            form.reset({
                name: '',
                description: '',
            });
        }
    }, [brandToEdit, form, open]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            if (brandToEdit) {
                await api.put(`/brands/${brandToEdit.id}`, values);
                toast({ title: 'Brand updated successfully' });
            } else {
                await api.post('/brands', values);
                toast({ title: 'Brand created successfully' });
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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{brandToEdit ? 'Edit Brand' : 'Add Brand'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Brand Name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Description" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit">{brandToEdit ? 'Save Changes' : 'Create Brand'}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
