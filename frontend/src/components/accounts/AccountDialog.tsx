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

const ACCOUNT_TYPES = ['Asset', 'Liability', 'Equity', 'Income', 'Expense'] as const;

const formSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.enum(ACCOUNT_TYPES),
});

interface AccountDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    accountToEdit?: any;
    onSave: () => void;
}

export function AccountDialog({ open, onOpenChange, accountToEdit, onSave }: AccountDialogProps) {
    const { toast } = useToast();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            type: 'Asset',
        },
    });

    useEffect(() => {
        if (accountToEdit) {
            form.reset({
                name: accountToEdit.name,
                type: accountToEdit.type,
            });
        } else {
            form.reset({
                name: '',
                type: 'Asset',
            });
        }
    }, [accountToEdit, form, open]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            if (accountToEdit) {
                await api.put(`/accounts/${accountToEdit.id}`, values);
                toast({ title: 'Account updated successfully' });
            } else {
                await api.post('/accounts', values);
                toast({ title: 'Account created successfully' });
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
                    <DialogTitle>{accountToEdit ? 'Edit Account' : 'Add Account'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Account Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Cash, Sales Revenue" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Account Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {ACCOUNT_TYPES.map((t) => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit">{accountToEdit ? 'Save Changes' : 'Create Account'}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
