'use client';

import { useState } from 'react';
import api from '@/services/api';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewAccount() {
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: '',
        type: 'Asset', // Default
        balance: 0
    });

    const accountTypes = ['Asset', 'Liability', 'Equity', 'Income', 'Expense'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/accounts', formData);
            router.push('/accounts');
        } catch (err: any) {
            alert(err.response?.data || 'Failed to create account');
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/accounts" className="text-slate-500 hover:text-slate-700">
                    <ArrowLeft size={24} />
                </Link>
                <h2 className="text-2xl font-bold text-slate-800">Add New Account</h2>
            </div>

            <form onSubmit={handleSubmit} className="card p-6 space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Account Name</label>
                        <input
                            type="text"
                            required
                            className="input"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Account Type</label>
                            <select
                                className="input"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                {accountTypes.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Initial Balance</label>
                            <input
                                type="number"
                                step="0.01"
                                className="input"
                                value={formData.balance}
                                onChange={e => setFormData({ ...formData, balance: Number(e.target.value) })}
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button type="submit" className="btn btn-primary">
                        <Save size={18} /> Save Account
                    </button>
                </div>
            </form>
        </div>
    );
}
