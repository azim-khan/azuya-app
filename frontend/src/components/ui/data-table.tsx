"use client"

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    getSortedRowModel,
    PaginationState,
    SortingState,
} from "@tanstack/react-table"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "./button"
import { Loader2, ChevronUp, ChevronDown } from "lucide-react"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    pageCount?: number
    pagination?: PaginationState
    setPagination?: React.Dispatch<React.SetStateAction<PaginationState>>
    sorting?: SortingState
    setSorting?: React.Dispatch<React.SetStateAction<SortingState>>
    manualPagination?: boolean
    manualSorting?: boolean
    loading?: boolean
    totalCount?: number
}

export function DataTable<TData, TValue>({
    columns,
    data,
    pageCount = -1,
    pagination,
    setPagination,
    sorting,
    setSorting,
    manualPagination = false,
    manualSorting = false,
    loading = false,
    totalCount,
}: DataTableProps<TData, TValue>) {
    const table = useReactTable({
        data,
        columns,
        pageCount: manualPagination ? pageCount : undefined,
        state: {
            ...(pagination ? { pagination } : {}),
            ...(sorting ? { sorting } : {}),
        },
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        manualPagination,
        manualSorting,
        initialState: {
            pagination: {
                pageSize: 50,
            },
        },
    })

    const currentPageIndex = pagination?.pageIndex ?? table.getState().pagination.pageIndex
    const currentPageSize = pagination?.pageSize ?? table.getState().pagination.pageSize
    const actualTotalCount = totalCount ?? (manualPagination ? (pageCount * currentPageSize) : table.getFilteredRowModel().rows.length)
    
    const from = actualTotalCount === 0 ? 0 : (currentPageIndex * currentPageSize) + 1
    const to = Math.min((currentPageIndex + 1) * currentPageSize, actualTotalCount)

    return (
        <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 flex flex-col min-h-0 rounded-md border bg-background">
                <Table wrapperClassName="flex-1">
                    <TableHeader className="sticky top-0 z-10 bg-background shadow-sm hover:bg-background">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder ? null : (
                                                <div
                                                    className={
                                                        header.column.getCanSort()
                                                            ? "cursor-pointer select-none flex items-center"
                                                            : ""
                                                    }
                                                    onClick={header.column.getToggleSortingHandler()}
                                                >
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                    {{
                                                        asc: <ChevronUp className="ml-2 h-4 w-4" />,
                                                        desc: <ChevronDown className="ml-2 h-4 w-4" />,
                                                    }[header.column.getIsSorted() as string] ?? null}
                                                </div>
                                            )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                                </TableCell>
                            </TableRow>
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground pl-2 font-medium">
                    Showing <span className="text-foreground">{from}</span> to <span className="text-foreground">{to}</span> of <span className="text-foreground">{actualTotalCount}</span> results
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Next
                </Button>
            </div>
        </div>
    )
}
