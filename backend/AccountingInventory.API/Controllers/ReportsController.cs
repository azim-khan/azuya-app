using AccountingInventory.Core.DTOs;
using AccountingInventory.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
            {
                query = query.Where(p => p.Name.Contains(specParams.Search) || p.SKU.Contains(specParams.Search));
            }

            if (specParams.ProductId.HasValue)
            {
                query = query.Where(p => p.Id == specParams.ProductId.Value);
            }

            var totalInventoryValue = await query.SumAsync(p => p.StockQuantity * p.PurchasePrice);
            var count = await query.CountAsync();

            var products = await query
                .OrderBy(p => p.Name)
                .Skip((specParams.PageIndex - 1) * specParams.PageSize)
                .Take(specParams.PageSize)
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

        [HttpGet("sales")]
        public async Task<ActionResult> GetSalesReport([FromQuery] ReportParams reportParams)
        {
            var query = _context.SaleDetails
                .Include(si => si.Product)
                .Include(si => si.Sale)
                .AsQueryable();

            if (reportParams.StartDate.HasValue)
            {
                query = query.Where(si => si.Sale.Date >= reportParams.StartDate.Value);
            }

            if (reportParams.EndDate.HasValue)
            {
                query = query.Where(si => si.Sale.Date <= reportParams.EndDate.Value);
            }

            if (!string.IsNullOrEmpty(reportParams.Search))
            {
                query = query.Where(si => si.Product.Name.Contains(reportParams.Search) || si.Product.SKU.Contains(reportParams.Search));
            }

            if (reportParams.ProductId.HasValue)
            {
                query = query.Where(si => si.ProductId == reportParams.ProductId.Value);
            }

            var totalValue = await query.SumAsync(si => si.Total);
            var count = await query.CountAsync();

            var items = await query
                .OrderByDescending(si => si.Sale.Date)
                .Skip((reportParams.PageIndex - 1) * reportParams.PageSize)
                .Take(reportParams.PageSize)
                .Select(si => new
                {
                    si.Id,
                    si.SaleId,
                    si.Sale.InvoiceNo,
                    si.Sale.Date,
                    si.ProductId,
                    ProductName = si.Product.Name,
                    ProductSKU = si.Product.SKU,
                    si.Quantity,
                    si.UnitPrice,
                    si.Total
                })
                .ToListAsync();

            return Ok(new
            {
                Data = items,
                PageIndex = reportParams.PageIndex,
                PageSize = reportParams.PageSize,
                Count = count,
                TotalValue = totalValue
            });
        }

        [HttpGet("purchases")]
        public async Task<ActionResult> GetPurchaseReport([FromQuery] ReportParams reportParams)
        {
            var query = _context.PurchaseDetails
                .Include(pd => pd.Product)
                .Include(pd => pd.Purchase)
                .AsQueryable();

            if (reportParams.StartDate.HasValue)
            {
                query = query.Where(pd => pd.Purchase.Date >= reportParams.StartDate.Value);
            }

            if (reportParams.EndDate.HasValue)
            {
                query = query.Where(pd => pd.Purchase.Date <= reportParams.EndDate.Value);
            }

            if (!string.IsNullOrEmpty(reportParams.Search))
            {
                query = query.Where(pd => pd.Product.Name.Contains(reportParams.Search) || pd.Product.SKU.Contains(reportParams.Search));
            }

            if (reportParams.ProductId.HasValue)
            {
                query = query.Where(pd => pd.ProductId == reportParams.ProductId.Value);
            }

            var totalValue = await query.SumAsync(pd => pd.Total);
            var count = await query.CountAsync();

            var items = await query
                .OrderByDescending(pd => pd.Purchase.Date)
                .Skip((reportParams.PageIndex - 1) * reportParams.PageSize)
                .Take(reportParams.PageSize)
                .Select(pd => new
                {
                    pd.Id,
                    pd.PurchaseId,
                    pd.Purchase.PurchaseNo,
                    pd.Purchase.Date,
                    pd.ProductId,
                    ProductName = pd.Product.Name,
                    ProductSKU = pd.Product.SKU,
                    pd.Quantity,
                    UnitCost = pd.UnitCost,
                    pd.Total
                })
                .ToListAsync();

            return Ok(new
            {
                Data = items,
                PageIndex = reportParams.PageIndex,
                PageSize = reportParams.PageSize,
                Count = count,
                TotalValue = totalValue
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
