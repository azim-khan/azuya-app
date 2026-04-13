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
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
});

interface PartyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: 'customer' | 'supplier';
    partyToEdit?: any;
    onSave: () => void;
}

export function PartyDialog({ open, onOpenChange, type, partyToEdit, onSave }: PartyDialogProps) {
    const { toast } = useToast();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            phone: '',
            email: '',
            address: '',
        },
    });

    useEffect(() => {
        if (partyToEdit) {
            form.reset({
                name: partyToEdit.name,
                phone: partyToEdit.phone || '',
                email: partyToEdit.email || '',
                address: partyToEdit.address || '',
            });
        } else {
            form.reset({
                name: '',
                phone: '',
                email: '',
                address: '',
            });
        }
    }, [partyToEdit, form, open]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const endpoint = type === 'customer' ? '/customers' : '/suppliers';

            if (partyToEdit) {
                await api.put(`${endpoint}/${partyToEdit.id}`, values);
                toast({ title: `${type === 'customer' ? 'Customer' : 'Supplier'} updated successfully` });
            } else {
                await api.post(endpoint, values);
                toast({ title: `${type === 'customer' ? 'Customer' : 'Supplier'} created successfully` });
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

    const title = type === 'customer' ? (partyToEdit ? 'Edit Customer' : 'Add Customer') : (partyToEdit ? 'Edit Supplier' : 'Add Supplier');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="capitalize">{title}</DialogTitle>
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
                                        <Input placeholder="Name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Phone Number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Email Address" type="email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Address" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" className="capitalize">{partyToEdit ? 'Save Changes' : `Create ${type}`}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
