using System.ComponentModel.DataAnnotations;

namespace AccountingInventory.Core.DTOs
{
    public class CreatePartyDto
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

    public class PartyDto : CreatePartyDto
    {
        public int Id { get; set; }
    }
}
