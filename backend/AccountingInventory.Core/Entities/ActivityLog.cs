using System;

namespace AccountingInventory.Core.Entities
{
    public class ActivityLog : BaseEntity
    {
        public string UserId { get; set; } = string.Empty;
        public AppUser? User { get; set; }
        public ActivityAction Action { get; set; }
        public ActivityEntity EntityName { get; set; }
        public string EntityId { get; set; } = string.Empty;
        public string RawData { get; set; } = string.Empty; // JSON representation
        public string Description { get; set; } = string.Empty;
    }
}
