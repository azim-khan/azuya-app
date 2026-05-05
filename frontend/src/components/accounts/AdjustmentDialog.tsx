'use client';

import { useState, useEffect } from 'react';
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
    DialogDescription,
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
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
    amount: z.coerce.number().refine(val => val !== 0, "Amount cannot be zero"),
    description: z.string().min(1, 'Description is required'),
    counterpartAccountId: z.string().min(1, 'Please select a counterpart account'),
});

interface AdjustmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    account?: any;
    onSave: () => void;
}

export function AdjustmentDialog({ open, onOpenChange, account, onSave }: AdjustmentDialogProps) {
    const { toast } = useToast();
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            amount: 0,
            description: '',
            counterpartAccountId: '',
        },
    });

    useEffect(() => {
        if (open) {
            const fetchAccounts = async () => {
                try {
                    const res = await api.get('/accounts?pageSize=1000');
                    const list = res.data?.data || res.data || [];
                    setAccounts(list.filter((a: any) => a.id !== account?.id));
                } catch (error) {
                    console.error('Failed to fetch accounts', error);
                }
            };
            fetchAccounts();
            form.reset({
                amount: 0,
                description: `Manual adjustment for ${account?.name}`,
                counterpartAccountId: '',
            });
        }
    }, [open, account, form]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setLoading(true);
        try {
            await api.post(`/accounts/${account.id}/adjust`, {
                amount: values.amount,
                description: values.description,
                counterpartAccountId: parseInt(values.counterpartAccountId),
            });
            toast({ title: 'Adjustment recorded successfully' });
            onSave();
            onOpenChange(false);
        } catch (error: any) {
            toast({
                title: 'Adjustment failed',
                description: error.response?.data || 'Something went wrong',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Adjust {account?.name}</DialogTitle>
                    <DialogDescription>
                        Record a manual adjustment. This will create a journal entry.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Adjustment Amount</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" placeholder="Positive to increase, negative to decrease" {...field} />
                                    </FormControl>
                                    <FormDescription className="text-[10px]">
                                        Positive increases balance, Negative decreases it.
                                    </FormDescription>
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
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="counterpartAccountId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Offsetting Account (Counterpart)</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Account" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {accounts.map((acc) => (
                                                <SelectItem key={acc.id} value={acc.id.toString()}>
                                                    {acc.name} ({acc.type})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Record Adjustment
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
