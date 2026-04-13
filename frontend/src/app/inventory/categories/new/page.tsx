'use client';

import { useState } from 'react';
import api from '@/services/api';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewCategory() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/categories', { name, description });
            router.push('/inventory?tab=categories');
        } catch (err: any) {
            alert(err.response?.data || 'Failed to create category');
        }
    };

    return (
        <div className="max-w-xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/inventory" className="text-slate-500 hover:text-slate-700">
                    <ArrowLeft size={24} />
                </Link>
                <h2 className="text-2xl font-bold text-slate-800">Add Category</h2>
            </div>

            <form onSubmit={handleSubmit} className="card p-6 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Category Name</label>
                    <input
                        type="text"
                        required
                        className="input"
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea
                        className="input h-24 resize-none"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button type="submit" className="btn btn-primary">
                        <Save size={18} /> Save Category
                    </button>
                </div>
            </form>
        </div>
    );
}
