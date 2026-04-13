using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AccountingInventory.Core.Entities
{
    public class Purchase : BaseEntity
    {
        public DateTime Date { get; set; } = DateTime.UtcNow;

        public int SupplierId { get; set; }
        public Supplier? Supplier { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        public List<PurchaseDetail> PurchaseDetails { get; set; } = new();
    }

    public class PurchaseDetail : BaseEntity
    {
        public int PurchaseId { get; set; }
        public Purchase? Purchase { get; set; }

        public int ProductId { get; set; }
        public Product? Product { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Quantity { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitCost { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Total { get; set; }
    }
}
