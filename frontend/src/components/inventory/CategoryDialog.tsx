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
  code: z.string().optional(),
  description: z.string().optional(),
});

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryToEdit?: any;
  onSave: () => void;
}

export function CategoryDialog({ open, onOpenChange, categoryToEdit, onSave }: CategoryDialogProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
    },
  });

  useEffect(() => {
    if (categoryToEdit) {
      form.reset({
        name: categoryToEdit.name,
        code: categoryToEdit.code || '',
        description: categoryToEdit.description || '',
      });
    } else {
      form.reset({
        name: '',
        code: '',
        description: '',
      });
    }
  }, [categoryToEdit, form, open]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (categoryToEdit) {
        await api.put(`/categories/${categoryToEdit.id}`, values);
        toast({ title: 'Category updated successfully' });
      } else {
        await api.post('/categories', values);
        toast({ title: 'Category created successfully' });
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
          <DialogTitle>{categoryToEdit ? 'Edit Category' : 'Add Category'}</DialogTitle>
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
                    <Input placeholder="Category Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Short Code (e.g. ELEC)" {...field} />
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
                    <Textarea placeholder="Description..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">{categoryToEdit ? 'Save Changes' : 'Create Category'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
