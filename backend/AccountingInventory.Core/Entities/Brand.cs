using System.ComponentModel.DataAnnotations;

namespace AccountingInventory.Core.Entities
{
    public class Brand : BaseEntity
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;
    }
}
