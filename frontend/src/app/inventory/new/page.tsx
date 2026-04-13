'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewProduct() {
    const router = useRouter();
    const [categories, setCategories] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        categoryId: '',
        unitId: '',
        purchasePrice: 0,
        salePrice: 0,
        stockQuantity: 0
    });

    useEffect(() => {
        fetchMasterData();
    }, []);

    const fetchMasterData = async () => {
        try {
            const [catRes, unitRes] = await Promise.all([
                api.get('/categories'),
                api.get('/units')
            ]);
            setCategories(catRes.data);
            setUnits(unitRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.categoryId || !formData.unitId) {
            alert('Please select category and unit.');
            return;
        }

        try {
            await api.post('/products', {
                ...formData,
                categoryId: Number(formData.categoryId),
                unitId: Number(formData.unitId)
            });
            router.push('/inventory');
        } catch (err: any) {
            alert(err.response?.data || 'Failed to create product');
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/inventory" className="text-slate-500 hover:text-slate-700">
                    <ArrowLeft size={24} />
                </Link>
                <h2 className="text-2xl font-bold text-slate-800">Add New Product</h2>
            </div>

            <form onSubmit={handleSubmit} className="card p-6 space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
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
                            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                            <select
                                className="input"
                                required
                                value={formData.categoryId}
                                onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                            >
                                <option value="">Select Category</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                            <select
                                className="input"
                                required
                                value={formData.unitId}
                                onChange={e => setFormData({ ...formData, unitId: e.target.value })}
                            >
                                <option value="">Select Unit</option>
                                {units.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Price</label>
                            <input
                                type="number"
                                step="0.01"
                                className="input"
                                value={formData.purchasePrice}
                                onChange={e => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Sale Price</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                className="input"
                                value={formData.salePrice}
                                onChange={e => setFormData({ ...formData, salePrice: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Initial Stock</label>
                            <input
                                type="number"
                                className="input"
                                value={formData.stockQuantity}
                                onChange={e => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button type="submit" className="btn btn-primary">
                        <Save size={18} /> Save Product
                    </button>
                </div>
            </form>
        </div>
    );
}
