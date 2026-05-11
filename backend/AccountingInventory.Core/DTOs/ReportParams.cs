using System;

namespace AccountingInventory.Core.DTOs
{
    public class ReportParams : ProductSpecParams
    {
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? Status { get; set; }
        public string? PaymentStatus { get; set; }
        public int? CustomerId { get; set; }
        public int? SupplierId { get; set; }
        public int? AccountId { get; set; }
        public string? UserId { get; set; }
    }
}
