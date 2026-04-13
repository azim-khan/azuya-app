'use client';

import { useRouter } from 'next/navigation';
import SaleForm from '@/components/sales/SaleForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NewSalePage() {
    const router = useRouter();

    return (
        <div className="p-6">
            <div className="mb-6">
                <Button onClick={() => router.push('/sales')} variant="ghost" className="text-slate-500 hover:text-slate-900">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sales
                </Button>
            </div>
            <SaleForm 
                onSuccess={() => router.push('/sales')} 
                onCancel={() => router.push('/sales')} 
            />
        </div>
    );
}
