using AccountingInventory.Core.DTOs;
using AccountingInventory.Core.Entities;
using AccountingInventory.Core.Interfaces;
using AccountingInventory.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AccountingInventory.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PurchasesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PurchasesController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Gets all purchases.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PurchaseDto>>> GetPurchases()
        {
            var purchases = await _context.Purchases
                .Include(p => p.Supplier)
                .Include(p => p.PurchaseDetails)
                .ThenInclude(pd => pd.Product)
                .OrderByDescending(p => p.Date)
                .ToListAsync();

            var dtos = purchases.Select(p => new PurchaseDto
            {
                Id = p.Id,
                SupplierId = p.SupplierId,
                SupplierName = p.Supplier?.Name ?? "",
                Date = p.Date,
                TotalAmount = p.TotalAmount,
                Items = p.PurchaseDetails.Select(pd => new PurchaseDetailDto
                {
                    ProductId = pd.ProductId,
                    ProductName = pd.Product?.Name ?? "",
                    Quantity = pd.Quantity,
                    UnitCost = pd.UnitCost,
                    Total = pd.Total
                }).ToList()
            });

            return Ok(dtos);
        }

        /// <summary>
        /// Creates a new purchase and updates stock.
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<Purchase>> CreatePurchase(CreatePurchaseDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var purchase = new Purchase
                {
                    Date = dto.Date,
                    SupplierId = dto.SupplierId,
                    TotalAmount = 0
                };

                foreach (var item in dto.Items)
                {
                    var product = await _context.Products.FindAsync(item.ProductId);
                    if (product == null) throw new Exception($"Product {item.ProductId} not found");

                    product.StockQuantity += item.Quantity;
                    // Optionally update purchase price
                    product.PurchasePrice = item.UnitCost;

                    var totalLine = item.Quantity * item.UnitCost;
                    purchase.TotalAmount += totalLine;

                    purchase.PurchaseDetails.Add(new PurchaseDetail
                    {
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        UnitCost = item.UnitCost,
                        Total = totalLine
                    });
                }

                _context.Purchases.Add(purchase);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return CreatedAtAction(nameof(GetPurchases), new { id = purchase.Id }, purchase);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(ex.Message);
            }
        }
    }
}
