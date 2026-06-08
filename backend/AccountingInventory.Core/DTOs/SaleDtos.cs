using System.ComponentModel.DataAnnotations;

namespace AccountingInventory.Core.DTOs
{
    public class SaleDto
    {
        public long Id { get; set; }
        public string InvoiceNo { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public long? CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public decimal SubTotal { get; set; }
        public decimal Discount { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal DueAmount { get; set; }
        public string PaymentStatus { get; set; } = string.Empty;
        public List<SaleDetailDto> Items { get; set; } = new();
    }

    public class SaleDetailDto
    {
        public long ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal Total { get; set; }
    }

    public class CreateSaleDto
    {
        [Required]
        public string InvoiceNo { get; set; } = string.Empty;
        public DateTime Date { get; set; } = DateTime.UtcNow;
        public long? CustomerId { get; set; }
        public decimal Discount { get; set; }
        public decimal PaidAmount { get; set; }
        public long PaymentAccountId { get; set; }
        public List<CreateSaleDetailDto> Items { get; set; } = new();
    }

    public class CreateSaleDetailDto
    {
        [Required]
        public long ProductId { get; set; }
        [Range(0.01, double.MaxValue)]
        public decimal Quantity { get; set; }
        [Range(0, double.MaxValue)]
        public decimal UnitPrice { get; set; }
    }
}
