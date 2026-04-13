'use client';

import { useState } from 'react';
import api from '@/services/api';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewUnit() {
    const router = useRouter();
    const [name, setName] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/units', { name });
            router.push('/inventory?tab=units');
        } catch (err: any) {
            alert(err.response?.data || 'Failed to create unit');
        }
    };

    return (
        <div className="max-w-xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/inventory" className="text-slate-500 hover:text-slate-700">
                    <ArrowLeft size={24} />
                </Link>
                <h2 className="text-2xl font-bold text-slate-800">Add Unit</h2>
            </div>

            <form onSubmit={handleSubmit} className="card p-6 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Unit Name</label>
                    <input
                        type="text"
                        placeholder="e.g. kg, pcs, box"
                        required
                        className="input"
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button type="submit" className="btn btn-primary">
                        <Save size={18} /> Save Unit
                    </button>
                </div>
            </form>
        </div>
    );
}
