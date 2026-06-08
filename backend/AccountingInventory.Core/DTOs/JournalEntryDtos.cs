using System;
using System.Collections.Generic;

namespace AccountingInventory.Core.DTOs
{
    public class ManualJournalEntryDto
    {
        public DateTime Date { get; set; } = DateTime.UtcNow;
        public string Description { get; set; } = string.Empty;
        public string ReferenceNo { get; set; } = string.Empty;
        public List<JournalItemDto> Items { get; set; } = new();
    }

    public class JournalItemDto
    {
        public long AccountId { get; set; }
        public decimal Debit { get; set; }
        public decimal Credit { get; set; }
    }
}
