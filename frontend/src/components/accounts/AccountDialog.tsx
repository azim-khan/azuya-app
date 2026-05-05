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
    FormDescription,
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
import { SystemAccount, AccountType } from '@/lib/constants';

const ACCOUNT_TYPES = Object.values(AccountType);

const formSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.enum(ACCOUNT_TYPES),
    openingBalance: z.coerce.number().default(0),
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
            type: AccountType.Asset,
            openingBalance: 0,
        },
    });

    useEffect(() => {
        if (accountToEdit) {
            form.reset({
                name: accountToEdit.name,
                type: accountToEdit.type,
                openingBalance: 0, // Reset to 0 when editing
            });
        } else {
            form.reset({
                name: '',
                type: AccountType.Asset,
                openingBalance: 0,
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
                                        <Input placeholder="e.g. Cash, Sales Revenue" {...field} disabled={accountToEdit?.isSystemAccount} />
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
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={accountToEdit?.isSystemAccount}>
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
                        {!accountToEdit && (
                            <FormField
                                control={form.control}
                                name="openingBalance"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Opening Balance</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                        </FormControl>
                                        <FormDescription className="text-[10px]">
                                            This will create an initial journal entry against "{SystemAccount.OpeningBalanceEquity}".
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                        <DialogFooter>
                            <Button type="submit">{accountToEdit ? 'Save Changes' : 'Create Account'}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
