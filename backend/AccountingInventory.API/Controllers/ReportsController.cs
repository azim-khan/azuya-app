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

        [HttpGet("stock")]
        public async Task<ActionResult<IEnumerable<object>>> GetStockReport()
        {
            // Simple stock report
            var stock = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Unit)
                .Select(p => new
                {
                    p.Id,
                    p.Name,

                    Category = p.Category != null ? p.Category.Name : "",
                    Unit = p.Unit != null ? p.Unit.Name : "",
                    Brand = p.Brand != null ? p.Brand.Name : "",
                    p.StockQuantity,
                    p.PurchasePrice,
                    StockValue = p.StockQuantity * p.PurchasePrice
                })
                .ToListAsync();

            return Ok(stock);
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
