using System;

namespace AccountingInventory.Core.DTOs
{
    public class ReportParams : ProductSpecParams
    {
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? Status { get; set; }
        public int? ProductId { get; set; }
    }
}
