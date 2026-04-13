using System.ComponentModel.DataAnnotations;

namespace AccountingInventory.Core.Entities
{
    public class Unit : BaseEntity
    {
        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = string.Empty; // e.g., "Kilogram", "Piece"
        
        [MaxLength(10)]
        public string Symbol { get; set; } = string.Empty; // e.g., "kg", "pcs"
    }
}
