using System.ComponentModel.DataAnnotations;

namespace AccountingInventory.Core.Entities
{
    public class Category : BaseEntity
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [MaxLength(20)]
        public string Code { get; set; } = string.Empty;
        
        public string? Description { get; set; }
    }
}
