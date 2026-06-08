using System;

namespace AccountingInventory.Core.DTOs
{
    public class ReportParams : ProductSpecParams
    {
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? Status { get; set; }
        public string? PaymentStatus { get; set; }
        public long? CustomerId { get; set; }
        public long? SupplierId { get; set; }
        public long? AccountId { get; set; }
        public string? UserId { get; set; }
    }
}
