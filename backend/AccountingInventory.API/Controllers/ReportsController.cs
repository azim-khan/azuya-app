using AccountingInventory.Core.DTOs;
using AccountingInventory.Infrastructure.Data;
using AccountingInventory.Infrastructure.Extensions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;

namespace AccountingInventory.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReportsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReportsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("stock-valuation")]
        public async Task<ActionResult> GetStockValuation([FromQuery] ProductSpecParams specParams)
        {
            var query = _context.Products.AsQueryable();

            if (!string.IsNullOrEmpty(specParams.Search))
                query = query.Where(p => p.Name.Contains(specParams.Search) || p.SKU.Contains(specParams.Search));

            if (specParams.ProductId.HasValue)
                query = query.Where(p => p.Id == specParams.ProductId.Value);

            var totalInventoryValue = await query.SumAsync(p => p.StockQuantity * p.PurchasePrice);
            var count = await query.CountAsync();

            var products = await query
                .ApplySorting(specParams, "Name")
                .ApplyPagination(specParams)
                .Select(p => new
                {
                    p.Id,
                    p.Name,
                    p.SKU,
                    p.StockQuantity,
                    p.PurchasePrice,
                    Value = p.StockQuantity * p.PurchasePrice
                })
                .ToListAsync();

            return Ok(new
            {
                Data = products,
                PageIndex = specParams.PageIndex,
                PageSize = specParams.PageSize,
                Count = count,
                TotalValue = totalInventoryValue
            });
        }

        [HttpGet("sales-summary")]
        public async Task<ActionResult> GetSalesSummary([FromQuery] ReportParams reportParams)
        {
            var query = _context.Sales
                .Include(s => s.Customer)
                .AsQueryable();

            if (reportParams.StartDate.HasValue)
                query = query.Where(s => s.Date >= reportParams.StartDate.Value);

            if (reportParams.EndDate.HasValue)
                query = query.Where(s => s.Date <= reportParams.EndDate.Value);

            if (!string.IsNullOrEmpty(reportParams.Search))
                query = query.Where(s => s.InvoiceNo.Contains(reportParams.Search));

            if (reportParams.CustomerId.HasValue)
                query = query.Where(s => s.CustomerId == reportParams.CustomerId.Value);

            if (!string.IsNullOrEmpty(reportParams.PaymentStatus))
                query = query.Where(s => s.PaymentStatus == reportParams.PaymentStatus);

            var count = await query.CountAsync();
            var totalValue = await query.SumAsync(s => s.TotalAmount);
            var totalPaid = await query.SumAsync(s => s.PaidAmount);
            var totalDue = await query.SumAsync(s => s.DueAmount);

            var items = await query
                .ApplySorting(reportParams, "Date desc")
                .ApplyPagination(reportParams)
                .Select(s => new
                {
                    s.Id,
                    s.InvoiceNo,
                    s.Date,
                    s.CustomerId,
                    CustomerName = s.Customer != null ? s.Customer.Name : "Walk-in Customer",
                    s.TotalAmount,
                    s.PaidAmount,
                    s.DueAmount,
                    s.PaymentStatus
                })
                .ToListAsync();

            return Ok(new
            {
                Data = items,
                PageIndex = reportParams.PageIndex,
                PageSize = reportParams.PageSize,
                Count = count,
                TotalValue = totalValue,
                TotalPaid = totalPaid,
                TotalDue = totalDue
            });
        }
        [HttpGet("sales/by-product")]
        public async Task<ActionResult> GetSalesByProduct([FromQuery] ReportParams reportParams)
        {
            var query = _context.SaleDetails.AsQueryable();

            if (reportParams.StartDate.HasValue)
                query = query.Where(sd => sd.Sale.Date >= reportParams.StartDate.Value);
            if (reportParams.EndDate.HasValue)
                query = query.Where(sd => sd.Sale.Date <= reportParams.EndDate.Value);
            if (!string.IsNullOrEmpty(reportParams.Search))
                query = query.Where(sd => sd.Product.Name.Contains(reportParams.Search));
            if (reportParams.ProductId.HasValue)
                query = query.Where(sd => sd.ProductId == reportParams.ProductId.Value);

            var groupedQuery = query
                .GroupBy(sd => new { sd.ProductId, sd.Product.Name, sd.Product.SKU })
                .Select(g => new
                {
                    ProductId = g.Key.ProductId,
                    ProductName = g.Key.Name,
                    SKU = g.Key.SKU,
                    QuantitySold = g.Sum(x => x.Quantity),
                    TotalRevenue = g.Sum(x => x.Total)
                });

            var totalRevenue = await groupedQuery.SumAsync(x => x.TotalRevenue);
            var count = await groupedQuery.CountAsync();

            var items = await groupedQuery
                .ApplySorting(reportParams, "TotalRevenue desc")
                .ApplyPagination(reportParams)
                .ToListAsync();

            return Ok(new
            {
                Data = items,
                PageIndex = reportParams.PageIndex,
                PageSize = reportParams.PageSize,
                Count = count,
                TotalRevenue = totalRevenue
            });
        }

        [HttpGet("sales/by-customer")]
        public async Task<ActionResult> GetSalesByCustomer([FromQuery] ReportParams reportParams)
        {
            var salesQuery = _context.Sales
                .Include(s => s.Customer)
                .AsQueryable();

            if (reportParams.StartDate.HasValue)
                salesQuery = salesQuery.Where(s => s.Date >= reportParams.StartDate.Value);
            if (reportParams.EndDate.HasValue)
                salesQuery = salesQuery.Where(s => s.Date <= reportParams.EndDate.Value);
            if (!string.IsNullOrEmpty(reportParams.Search))
                salesQuery = salesQuery.Where(s => s.Customer.Name.Contains(reportParams.Search));
            if (reportParams.CustomerId.HasValue)
                salesQuery = salesQuery.Where(s => s.CustomerId == reportParams.CustomerId.Value);

            var groupedQuery = salesQuery
                .GroupBy(s => new { s.CustomerId, CustomerName = s.Customer != null ? s.Customer.Name : "Walk-in Customer" })
                .Select(g => new
                {
                    CustomerId = g.Key.CustomerId,
                    CustomerName = g.Key.CustomerName,
                    InvoiceCount = g.Count(),
                    TotalAmount = g.Sum(x => x.TotalAmount),
                    PaidAmount = g.Sum(x => x.PaidAmount),
                    DueAmount = g.Sum(x => x.DueAmount)
                });

            var grouped = await groupedQuery.ToListAsync();

            return Ok(new
            {
                Data = grouped
                    .AsQueryable()
                    .ApplySorting(reportParams, "TotalAmount desc")
                    .ApplyPagination(reportParams)
                    .ToList(),
                PageIndex = reportParams.PageIndex,
                PageSize = reportParams.PageSize,
                Count = grouped.Count,
                TotalValue = grouped.Sum(x => x.TotalAmount),
                TotalPaid = grouped.Sum(x => x.PaidAmount),
                TotalDue = grouped.Sum(x => x.DueAmount)
            });
        }

        [HttpGet("purchases-summary")]
        public async Task<ActionResult> GetPurchasesSummary([FromQuery] ReportParams reportParams)
        {
            var query = _context.Purchases
                .Include(p => p.Supplier)
                .AsQueryable();

            if (reportParams.StartDate.HasValue)
                query = query.Where(p => p.Date >= reportParams.StartDate.Value);

            if (reportParams.EndDate.HasValue)
                query = query.Where(p => p.Date <= reportParams.EndDate.Value);

            if (!string.IsNullOrEmpty(reportParams.Search))
                query = query.Where(p => p.PurchaseNo.Contains(reportParams.Search));

            if (reportParams.SupplierId.HasValue)
                query = query.Where(p => p.SupplierId == reportParams.SupplierId.Value);

            if (!string.IsNullOrEmpty(reportParams.PaymentStatus))
                query = query.Where(p => p.PaymentStatus == reportParams.PaymentStatus);

            var count = await query.CountAsync();
            var totalValue = await query.SumAsync(p => p.TotalAmount);
            var totalPaid = await query.SumAsync(p => p.PaidAmount);
            var totalDue = await query.SumAsync(p => p.DueAmount);

            var items = await query
                .ApplySorting(reportParams, "Date desc")
                .ApplyPagination(reportParams)
                .Select(p => new
                {
                    p.Id,
                    p.PurchaseNo,
                    p.Date,
                    p.SupplierId,
                    SupplierName = p.Supplier != null ? p.Supplier.Name : "Unknown Supplier",
                    p.TotalAmount,
                    p.PaidAmount,
                    p.DueAmount,
                    p.PaymentStatus
                })
                .ToListAsync();

            return Ok(new
            {
                Data = items,
                PageIndex = reportParams.PageIndex,
                PageSize = reportParams.PageSize,
                Count = count,
                TotalValue = totalValue,
                TotalPaid = totalPaid,
                TotalDue = totalDue
            });
        }
        [HttpGet("purchases/by-product")]
        public async Task<ActionResult> GetPurchasesByProduct([FromQuery] ReportParams reportParams)
        {
            var query = _context.PurchaseDetails.AsQueryable();

            if (reportParams.StartDate.HasValue)
                query = query.Where(pd => pd.Purchase.Date >= reportParams.StartDate.Value);
            if (reportParams.EndDate.HasValue)
                query = query.Where(pd => pd.Purchase.Date <= reportParams.EndDate.Value);
            if (!string.IsNullOrEmpty(reportParams.Search))
                query = query.Where(pd => pd.Product.Name.Contains(reportParams.Search));
            if (reportParams.ProductId.HasValue)
                query = query.Where(pd => pd.ProductId == reportParams.ProductId.Value);

            var groupedQuery = query
                .GroupBy(pd => new { pd.ProductId, pd.Product.Name, pd.Product.SKU })
                .Select(g => new
                {
                    ProductId = g.Key.ProductId,
                    ProductName = g.Key.Name,
                    SKU = g.Key.SKU,
                    QuantityPurchased = g.Sum(x => x.Quantity),
                    TotalCost = g.Sum(x => x.Total)
                });

            var totalCost = await groupedQuery.SumAsync(x => x.TotalCost);
            var count = await groupedQuery.CountAsync();

            var items = await groupedQuery
                .ApplySorting(reportParams, "TotalCost desc")
                .ApplyPagination(reportParams)
                .ToListAsync();

            return Ok(new
            {
                Data = items,
                PageIndex = reportParams.PageIndex,
                PageSize = reportParams.PageSize,
                Count = count,
                TotalCost = totalCost
            });
        }

        [HttpGet("purchases/by-supplier")]
        public async Task<ActionResult> GetPurchasesBySupplier([FromQuery] ReportParams reportParams)
        {
            var purchasesQuery = _context.Purchases
                .Include(p => p.Supplier)
                .AsQueryable();

            if (reportParams.StartDate.HasValue)
                purchasesQuery = purchasesQuery.Where(p => p.Date >= reportParams.StartDate.Value);
            if (reportParams.EndDate.HasValue)
                purchasesQuery = purchasesQuery.Where(p => p.Date <= reportParams.EndDate.Value);
            if (!string.IsNullOrEmpty(reportParams.Search))
                purchasesQuery = purchasesQuery.Where(p => p.Supplier.Name.Contains(reportParams.Search));
            if (reportParams.SupplierId.HasValue)
                purchasesQuery = purchasesQuery.Where(p => p.SupplierId == reportParams.SupplierId.Value);

            var groupedQuery = purchasesQuery
                .GroupBy(p => new { p.SupplierId, SupplierName = p.Supplier != null ? p.Supplier.Name : "Unknown Supplier" })
                .Select(g => new
                {
                    SupplierId = g.Key.SupplierId,
                    SupplierName = g.Key.SupplierName,
                    InvoiceCount = g.Count(),
                    TotalAmount = g.Sum(x => x.TotalAmount),
                    PaidAmount = g.Sum(x => x.PaidAmount),
                    DueAmount = g.Sum(x => x.DueAmount)
                });

            var grouped = await groupedQuery.ToListAsync();

            return Ok(new
            {
                Data = grouped
                    .AsQueryable()
                    .ApplySorting(reportParams, "TotalAmount desc")
                    .ApplyPagination(reportParams)
                    .ToList(),
                PageIndex = reportParams.PageIndex,
                PageSize = reportParams.PageSize,
                Count = grouped.Count,
                TotalValue = grouped.Sum(x => x.TotalAmount),
                TotalPaid = grouped.Sum(x => x.PaidAmount),
                TotalDue = grouped.Sum(x => x.DueAmount)
            });
        }

        [HttpGet("profit/by-product")]
        public async Task<ActionResult> GetProfitByProduct([FromQuery] ReportParams reportParams)
        {
            var salesQuery = _context.SaleDetails
                .Include(sd => sd.Product)
                .Include(sd => sd.Sale)
                .AsQueryable();

            if (reportParams.StartDate.HasValue)
                salesQuery = salesQuery.Where(sd => sd.Sale.Date >= reportParams.StartDate.Value);

            if (reportParams.EndDate.HasValue)
                salesQuery = salesQuery.Where(sd => sd.Sale.Date <= reportParams.EndDate.Value);

            if (!string.IsNullOrEmpty(reportParams.Search))
                salesQuery = salesQuery.Where(sd => sd.Product.Name.Contains(reportParams.Search));

            var groupedQuery = salesQuery
                .GroupBy(sd => new { sd.ProductId, sd.Product.Name, sd.Product.SKU, sd.Product.PurchasePrice })
                .Select(g => new
                {
                    ProductId = g.Key.ProductId,
                    ProductName = g.Key.Name,
                    SKU = g.Key.SKU,
                    QuantitySold = g.Sum(x => x.Quantity),
                    TotalRevenue = g.Sum(x => x.Total),
                    UnitCost = g.Key.PurchasePrice,
                    TotalCost = g.Sum(x => x.Quantity) * g.Key.PurchasePrice,
                    TotalProfit = g.Sum(x => x.Total) - (g.Sum(x => x.Quantity) * g.Key.PurchasePrice)
                });

            var grouped = await groupedQuery.ToListAsync();

            var count = grouped.Count;
            var items = grouped
                .AsQueryable()
                .ApplySorting(reportParams, "TotalProfit desc")
                .ApplyPagination(reportParams)
                .ToList();
            var totalProfit = grouped.Sum(x => x.TotalProfit);

            return Ok(new
            {
                Data = items,
                PageIndex = reportParams.PageIndex,
                PageSize = reportParams.PageSize,
                Count = count,
                TotalProfit = totalProfit
            });
        }

        [HttpGet("profit/margins")]
        public async Task<ActionResult> GetProfitMargins([FromQuery] ReportParams reportParams)
        {
            var query = _context.Products.AsQueryable();

            if (!string.IsNullOrEmpty(reportParams.Search))
                query = query.Where(p => p.Name.Contains(reportParams.Search) || p.SKU.Contains(reportParams.Search));

            if (reportParams.ProductId.HasValue)
                query = query.Where(p => p.Id == reportParams.ProductId.Value);

            var count = await query.CountAsync();

            var mappedQuery = query
                .Select(p => new
                {
                    p.Id,
                    p.Name,
                    p.SKU,
                    p.PurchasePrice,
                    p.SalePrice,
                    ProfitPerUnit = p.SalePrice - p.PurchasePrice,
                    Margin = p.SalePrice > 0 ? ((p.SalePrice - p.PurchasePrice) / p.SalePrice) * 100 : 0
                });

            var items = await mappedQuery
                .ApplySorting(reportParams, "Margin desc")
                .ApplyPagination(reportParams)
                .ToListAsync();

            return Ok(new
            {
                Data = items,
                PageIndex = reportParams.PageIndex,
                PageSize = reportParams.PageSize,
                Count = count
            });
        }

        [HttpGet("dashboard")]
        public async Task<ActionResult<object>> GetDashboardStats()
        {
            var totalSales = await _context.Sales.SumAsync(s => s.TotalAmount);
            var totalPurchases = await _context.Purchases.SumAsync(p => p.TotalAmount);
            var productCount = await _context.Products.CountAsync();
            var lowStockCount = await _context.Products.CountAsync(p => p.StockQuantity < 10);

            return Ok(new
            {
                TotalSales = totalSales,
                TotalPurchases = totalPurchases,
                ProductCount = productCount,
                LowStockCount = lowStockCount
            });
        }
    }
}
