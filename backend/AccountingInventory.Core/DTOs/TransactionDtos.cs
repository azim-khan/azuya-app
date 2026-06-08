using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace AccountingInventory.Core.DTOs
{

    // Purchase DTOs
    public class CreatePurchaseDetailDto
    {
        [Required]
        public long ProductId { get; set; }
        [Required]
        public decimal Quantity { get; set; }
        [Required]
        public decimal UnitCost { get; set; }
    }

    public class CreatePurchaseDto
    {
        [Required]
        public string PurchaseNo { get; set; } = string.Empty;
        public DateTime Date { get; set; } = DateTime.UtcNow;
        [Required]
        public long SupplierId { get; set; }
        public decimal PaidAmount { get; set; }
        public long PaymentAccountId { get; set; }
        public List<CreatePurchaseDetailDto> Items { get; set; } = new();
    }

    public class PurchaseDetailDto
    {
        public long ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public decimal UnitCost { get; set; }
        public decimal Total { get; set; }
    }

    public class PurchaseDto
    {
        public long Id { get; set; }
        public string PurchaseNo { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public long SupplierId { get; set; }
        public string SupplierName { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal DueAmount { get; set; }
        public string PaymentStatus { get; set; } = string.Empty;
        public List<PurchaseDetailDto> Items { get; set; } = new();
    }
}
