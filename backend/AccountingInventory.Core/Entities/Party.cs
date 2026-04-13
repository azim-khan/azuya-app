using System.ComponentModel.DataAnnotations;

namespace AccountingInventory.Core.Entities
{
    public class Customer : BaseEntity
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [MaxLength(20)]
        public string? Phone { get; set; }
        
        [MaxLength(100)]
        public string? Email { get; set; }
        
        public string? Address { get; set; }
    }

    public class Supplier : BaseEntity
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [MaxLength(20)]
        public string? Phone { get; set; }
        
        [MaxLength(100)]
        public string? Email { get; set; }
        
        public string? Address { get; set; }
    }
}
