using System;

namespace AccountingInventory.Core.Entities
{
    public class ActivityLog : BaseEntity
    {
        public string UserId { get; set; } = string.Empty;
        public AppUser? User { get; set; }
        public string Action { get; set; } = string.Empty; // Create, Update, Delete
        public string EntityName { get; set; } = string.Empty; // Sale, Purchase, Product, etc.
        public string EntityId { get; set; } = string.Empty;
        public string RawData { get; set; } = string.Empty; // JSON representation
        public string Description { get; set; } = string.Empty;
    }
}
