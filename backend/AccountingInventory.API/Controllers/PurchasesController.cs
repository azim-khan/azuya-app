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
        public async Task<ActionResult<IEnumerable<PurchaseDto>>> GetPurchases(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] string? search,
            [FromQuery] string? status)
        {
            var query = _context.Purchases
                .Include(p => p.Supplier)
                .Include(p => p.PurchaseDetails)
                .ThenInclude(pd => pd.Product)
                .AsQueryable();

            if (startDate.HasValue)
            {
                var start = startDate.Value.Date;
                query = query.Where(p => p.Date >= start);
            }

            if (endDate.HasValue)
            {
                var end = endDate.Value.Date.AddDays(1).AddTicks(-1);
                query = query.Where(p => p.Date <= end);
            }

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(p => p.PurchaseNo.Contains(search) || (p.Supplier != null && p.Supplier.Name.Contains(search)));
            }

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(p => p.PaymentStatus == status);
            }

            var purchases = await query
                .OrderByDescending(p => p.Date)
                .ToListAsync();

            var dtos = purchases.Select(p => new PurchaseDto
            {
                Id = p.Id,
                PurchaseNo = p.PurchaseNo,
                SupplierId = p.SupplierId,
                SupplierName = p.Supplier?.Name ?? "",
                Date = p.Date,
                TotalAmount = p.TotalAmount,
                PaidAmount = p.PaidAmount,
                DueAmount = p.DueAmount,
                PaymentStatus = p.PaymentStatus,
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

        [HttpGet("{id}")]
        public async Task<ActionResult<PurchaseDto>> GetPurchase(int id)
        {
            var p = await _context.Purchases
                .Include(p => p.Supplier)
                .Include(p => p.PurchaseDetails)
                .ThenInclude(pd => pd.Product)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (p == null) return NotFound();

            var dto = new PurchaseDto
            {
                Id = p.Id,
                PurchaseNo = p.PurchaseNo,
                SupplierId = p.SupplierId,
                SupplierName = p.Supplier?.Name ?? "",
                Date = p.Date,
                TotalAmount = p.TotalAmount,
                PaidAmount = p.PaidAmount,
                DueAmount = p.DueAmount,
                PaymentStatus = p.PaymentStatus,
                Items = p.PurchaseDetails.Select(pd => new PurchaseDetailDto
                {
                    ProductId = pd.ProductId,
                    ProductName = pd.Product?.Name ?? "",
                    Quantity = pd.Quantity,
                    UnitCost = pd.UnitCost,
                    Total = pd.Total
                }).ToList()
            };

            return Ok(dto);
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
                    PurchaseNo = dto.PurchaseNo,
                    Date = dto.Date,
                    SupplierId = dto.SupplierId,
                    PaidAmount = dto.PaidAmount,
                    TotalAmount = 0
                };

                foreach (var item in dto.Items)
                {
                    var product = await _context.Products.FindAsync(item.ProductId);
                    if (product == null) throw new Exception($"Product {item.ProductId} not found");

                    product.StockQuantity += item.Quantity;
                    product.PurchasePrice = item.UnitCost; // Maintain recent cost

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

                purchase.DueAmount = purchase.TotalAmount - purchase.PaidAmount;
                if (purchase.DueAmount <= 0) purchase.PaymentStatus = "Paid";
                else if (purchase.PaidAmount > 0) purchase.PaymentStatus = "Partial";
                else purchase.PaymentStatus = "Due";

                _context.Purchases.Add(purchase);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return Ok(new { id = purchase.Id });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePurchase(int id, CreatePurchaseDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var purchase = await _context.Purchases
                    .Include(p => p.PurchaseDetails)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (purchase == null) return NotFound();

                // 1. Revert previous stock increase
                foreach (var detail in purchase.PurchaseDetails)
                {
                    var product = await _context.Products.FindAsync(detail.ProductId);
                    if (product != null)
                    {
                        product.StockQuantity -= detail.Quantity;
                    }
                }

                // 2. Clear old lines
                _context.PurchaseDetails.RemoveRange(purchase.PurchaseDetails);

                // 3. Update props and re-apply stock
                purchase.PurchaseNo = dto.PurchaseNo;
                purchase.Date = dto.Date;
                purchase.SupplierId = dto.SupplierId;
                purchase.PaidAmount = dto.PaidAmount;
                purchase.TotalAmount = 0;

                foreach (var item in dto.Items)
                {
                    var product = await _context.Products.FindAsync(item.ProductId);
                    if (product == null) throw new Exception($"Product {item.ProductId} not found");

                    product.StockQuantity += item.Quantity;
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

                purchase.DueAmount = purchase.TotalAmount - purchase.PaidAmount;
                if (purchase.DueAmount <= 0) purchase.PaymentStatus = "Paid";
                else if (purchase.PaidAmount > 0) purchase.PaymentStatus = "Partial";
                else purchase.PaymentStatus = "Due";

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { id = purchase.Id });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePurchase(int id)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var purchase = await _context.Purchases
                    .Include(p => p.PurchaseDetails)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (purchase == null) return NotFound();

                // Revert stock increase
                foreach (var detail in purchase.PurchaseDetails)
                {
                    var product = await _context.Products.FindAsync(detail.ProductId);
                    if (product != null)
                    {
                        product.StockQuantity -= detail.Quantity;
                    }
                }

                _context.Purchases.Remove(purchase);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok();
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(ex.Message);
            }
        }
        [HttpGet("next-purchase-number")]
        public async Task<ActionResult<object>> GetNextPurchaseNumber()
        {
            var lastPurchase = await _context.Purchases
                .OrderByDescending(p => p.Id)
                .FirstOrDefaultAsync();

            int nextId = (lastPurchase?.Id ?? 0) + 1;
            return Ok(new { purchaseNo = $"P-{nextId:D4}" });
        }
    }
}
