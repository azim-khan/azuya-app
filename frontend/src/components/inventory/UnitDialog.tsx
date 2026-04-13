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
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    symbol: z.string().optional(),
});

interface UnitDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    unitToEdit?: any;
    onSave: () => void;
}

export function UnitDialog({ open, onOpenChange, unitToEdit, onSave }: UnitDialogProps) {
    const { toast } = useToast();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            symbol: '',
        },
    });

    useEffect(() => {
        if (unitToEdit) {
            form.reset({
                name: unitToEdit.name,
                symbol: unitToEdit.symbol || '',
            });
        } else {
            form.reset({
                name: '',
                symbol: '',
            });
        }
    }, [unitToEdit, form, open]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            if (unitToEdit) {
                await api.put(`/units/${unitToEdit.id}`, values);
                toast({ title: 'Unit updated successfully' });
            } else {
                await api.post('/units', values);
                toast({ title: 'Unit created successfully' });
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
                    <DialogTitle>{unitToEdit ? 'Edit Unit' : 'Add Unit'}</DialogTitle>
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
                                        <Input placeholder="Unit Name (e.g. Kilogram)" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="symbol"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Symbol</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Symbol (e.g. kg)" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit">{unitToEdit ? 'Save Changes' : 'Create Unit'}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
