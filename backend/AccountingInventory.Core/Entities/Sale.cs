using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AccountingInventory.Core.Entities
{
    public class Sale : BaseEntity
    {
        [Required]
        [MaxLength(50)]
        public string InvoiceNo { get; set; } = string.Empty;

        public DateTime Date { get; set; } = DateTime.UtcNow;

        public int? CustomerId { get; set; }
        public Customer? Customer { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal SubTotal { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Discount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal PaidAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal DueAmount { get; set; }

        [MaxLength(20)]
        public string PaymentStatus { get; set; } = "Paid"; // Paid, Partial, Due

        public List<SaleDetail> SaleDetails { get; set; } = new();
    }

    public class SaleDetail : BaseEntity
    {
        public int SaleId { get; set; }
        public Sale? Sale { get; set; }

        public int ProductId { get; set; }
        public Product? Product { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Quantity { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Total { get; set; }
    }
}
