using AccountingInventory.Core.DTOs;
using AccountingInventory.Core.Entities;
using AccountingInventory.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AccountingInventory.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SalesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SalesController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<SaleDto>>> GetSales(
            [FromQuery] DateTime? startDate, 
            [FromQuery] DateTime? endDate)
        {
            var query = _context.Sales
                .Include(s => s.Customer)
                .AsQueryable();

            if (startDate.HasValue)
            {
                var start = startDate.Value.Date;
                query = query.Where(s => s.Date >= start);
            }

            if (endDate.HasValue)
            {
                var end = endDate.Value.Date.AddDays(1).AddTicks(-1);
                query = query.Where(s => s.Date <= end);
            }

            var sales = await query
                .OrderByDescending(s => s.Date)
                .ToListAsync();

            var dtos = sales.Select(s => new SaleDto
            {
                Id = s.Id,
                InvoiceNo = s.InvoiceNo,
                Date = s.Date,
                CustomerId = s.CustomerId,
                CustomerName = s.Customer?.Name ?? "Walk-in Customer",
                SubTotal = s.SubTotal,
                Discount = s.Discount,
                TotalAmount = s.TotalAmount,
                PaidAmount = s.PaidAmount,
                DueAmount = s.DueAmount,
                PaymentStatus = s.PaymentStatus
            });

            return Ok(dtos);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<SaleDto>> GetSale(int id)
        {
            var sale = await _context.Sales
                .Include(s => s.Customer)
                .Include(s => s.SaleDetails)
                .ThenInclude(sd => sd.Product)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (sale == null) return NotFound();

            var dto = new SaleDto
            {
                Id = sale.Id,
                InvoiceNo = sale.InvoiceNo,
                Date = sale.Date,
                CustomerId = sale.CustomerId,
                CustomerName = sale.Customer?.Name ?? "Walk-in Customer",
                SubTotal = sale.SubTotal,
                Discount = sale.Discount,
                TotalAmount = sale.TotalAmount,
                PaidAmount = sale.PaidAmount,
                DueAmount = sale.DueAmount,
                PaymentStatus = sale.PaymentStatus,
                Items = sale.SaleDetails.Select(sd => new SaleDetailDto
                {
                    ProductId = sd.ProductId,
                    ProductName = sd.Product?.Name ?? "Unknown",
                    Quantity = sd.Quantity,
                    UnitPrice = sd.UnitPrice,
                    Total = sd.Total
                }).ToList()
            };

            return Ok(dto);
        }

        [HttpGet("next-invoice-number")]
        public async Task<ActionResult<string>> GetNextInvoiceNumber()
        {
            var lastSale = await _context.Sales
                .OrderByDescending(s => s.Id)
                .FirstOrDefaultAsync();

            int nextId = (lastSale?.Id ?? 0) + 1;
            return Ok(new { invoiceNo = $"SL-{nextId:D4}" });
        }

        [HttpPost]
        public async Task<ActionResult<Sale>> CreateSale(CreateSaleDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var sale = new Sale
                {
                    InvoiceNo = dto.InvoiceNo,
                    Date = dto.Date,
                    CustomerId = dto.CustomerId,
                    Discount = dto.Discount,
                    PaidAmount = dto.PaidAmount,
                    SubTotal = 0
                };

                foreach (var item in dto.Items)
                {
                    var product = await _context.Products.FindAsync(item.ProductId);
                    if (product == null) throw new Exception($"Product {item.ProductId} not found");

                    if (product.StockQuantity < item.Quantity)
                    {
                        throw new Exception($"Resulting stock for product {product.Name} would be negative.");
                    }

                    product.StockQuantity -= item.Quantity;

                    var totalLine = item.Quantity * item.UnitPrice;
                    sale.SubTotal += totalLine;

                    sale.SaleDetails.Add(new SaleDetail
                    {
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice,
                        Total = totalLine
                    });
                }

                sale.TotalAmount = sale.SubTotal - sale.Discount;
                sale.DueAmount = sale.TotalAmount - sale.PaidAmount;
                
                if (sale.DueAmount <= 0) sale.PaymentStatus = "Paid";
                else if (sale.PaidAmount > 0) sale.PaymentStatus = "Partial";
                else sale.PaymentStatus = "Due";

                _context.Sales.Add(sale);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return Ok(new { id = sale.Id });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSale(int id)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var sale = await _context.Sales
                    .Include(s => s.SaleDetails)
                    .FirstOrDefaultAsync(s => s.Id == id);
                
                if (sale == null) return NotFound();

                // Restore stock
                foreach (var detail in sale.SaleDetails)
                {
                    var product = await _context.Products.FindAsync(detail.ProductId);
                    if (product != null)
                    {
                        product.StockQuantity += detail.Quantity;
                    }
                }

                _context.Sales.Remove(sale);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(ex.Message);
            }
        }
    }
}
