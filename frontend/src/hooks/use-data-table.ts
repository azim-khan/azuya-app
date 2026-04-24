import { useState, useEffect, useCallback, useMemo } from 'react';
import { SortingState, PaginationState } from '@tanstack/react-table';
import api from '@/services/api';

interface UseDataTableOptions<TData> {
    endpoint: string;
    initialPageSize?: number;
    initialFilters?: Record<string, any>;
    onDataFetched?: (data: any) => void;
}

export function useDataTable<TData>({
    endpoint,
    initialPageSize = 50,
    initialFilters = {},
    onDataFetched
}: UseDataTableOptions<TData>) {
    const [data, setData] = useState<TData[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [summaryStats, setSummaryStats] = useState<any>({});

    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: initialPageSize,
    });

    const [sorting, setSortingState] = useState<SortingState>([]);
    
    const setSorting = useCallback((newSorting: SortingState | ((prev: SortingState) => SortingState)) => {
        setSortingState(prev => {
            const next = typeof newSorting === 'function' ? newSorting(prev) : newSorting;
            const isSame = JSON.stringify(prev) === JSON.stringify(next);
            return isSame ? prev : next;
        });
    }, []);
    const [filters, setFiltersState] = useState<Record<string, any>>(initialFilters);

    const setFilters = useCallback((newFilters: Record<string, any> | ((prev: Record<string, any>) => Record<string, any>)) => {
        setFiltersState(prev => {
            const next = typeof newFilters === 'function' ? newFilters(prev) : newFilters;
            const isSame = JSON.stringify(prev) === JSON.stringify(next);
            return isSame ? prev : next;
        });
    }, []);

    const fetchData = useCallback(async () => {
        if (!endpoint) return;
        
        setLoading(true);
        try {
            const params = new URLSearchParams({
                pageIndex: (pagination.pageIndex + 1).toString(),
                pageSize: pagination.pageSize.toString(),
            });

            // Add sorting params
            if (sorting.length > 0) {
                params.append('sort', sorting[0].id);
                params.append('sortOrder', sorting[0].desc ? 'desc' : 'asc');
            }

            // Add all filters
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '' && value !== 'All') {
                    params.append(key, value.toString());
                }
            });

            const res = await api.get(`${endpoint}?${params}`);
            
            // Handle different API response shapes
            const responseData = res.data.data || res.data || [];
            const count = res.data.count ?? (Array.isArray(res.data) ? res.data.length : 0);

            setData(responseData);
            setTotalCount(count);

            // Extract extra metadata if present (like summary stats in reports)
            if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
                const { data: _, count: __, pageIndex, pageSize, ...rest } = res.data;
                
                // Only update if summary stats actually changed (primitive check)
                setSummaryStats(prev => {
                    const isSame = JSON.stringify(prev) === JSON.stringify(rest);
                    return isSame ? prev : rest;
                });
                
                if (onDataFetched) onDataFetched(res.data);
            }

        } catch (error) {
            console.error(`Failed to fetch data from ${endpoint}:`, error);
            setData([]);
            setTotalCount(0);
        } finally {
            setLoading(false);
        }
    }, [endpoint, pagination.pageIndex, pagination.pageSize, sorting, filters, onDataFetched]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Helper to update individual filters
    const updateFilter = (key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Reset pagination when filters, sorting or endpoint change
    useEffect(() => {
        setPagination(prev => {
            if (prev.pageIndex === 0) return prev; // Avoid redundant update
            return { ...prev, pageIndex: 0 };
        });
    }, [filters, sorting, endpoint]);

    return {
        data,
        loading,
        totalCount,
        summaryStats,
        pagination,
        setPagination,
        sorting,
        setSorting,
        filters,
        setFilters,
        updateFilter,
        refresh: fetchData
    };
}
