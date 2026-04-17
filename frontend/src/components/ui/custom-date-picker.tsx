'use client';

import React from 'react';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface CustomDatePickerProps {
    value: string;
    onChange: (value: string) => void;
    type?: 'date' | 'datetime-local';
    placeholder?: string;
    className?: string;
}

export function CustomDatePicker({
    value,
    onChange,
    type = 'date',
    placeholder = 'dd/mm/yyyy',
    className
}: CustomDatePickerProps) {
    const displayFormat = type === 'date' ? 'dd/MM/yyyy' : 'dd/MM/yyyy HH:mm';
    const displayPlaceholder = type === 'date' ? 'dd/mm/yyyy' : 'dd/mm/yyyy hh:mm';

    const getDisplayValue = () => {
        if (!value) return <span className="text-slate-300">{placeholder || displayPlaceholder}</span>;
        try {
            return format(new Date(value), displayFormat);
        } catch (e) {
            return <span className="text-slate-300">{placeholder || displayPlaceholder}</span>;
        }
    };

    return (
        <div className={cn("relative group w-full", className)} style={{ minWidth: "140px" }}>
            <Input
                type={type}
                className="absolute inset-0 opacity-0 cursor-pointer z-20 w-full h-full"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onClick={(e) => e.currentTarget.showPicker?.()}
            />
            <div className="h-10 border border-slate-200 rounded-md px-3 flex items-center justify-between bg-white text-sm text-slate-600 pointer-events-none group-focus-within:ring-2 group-focus-within:ring-slate-900 group-focus-within:ring-offset-2">
                {getDisplayValue()}
                <Calendar className="h-4 w-4 text-slate-400 ml-2" />
            </div>
        </div>
    );
}
