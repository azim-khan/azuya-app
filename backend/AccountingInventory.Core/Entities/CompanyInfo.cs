using System.ComponentModel.DataAnnotations;

namespace AccountingInventory.Core.Entities
{
    public class CompanyInfo : BaseEntity
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(200)]
        public string? Tagline { get; set; }

        public string? Logo { get; set; } // Base64 string

        [StringLength(500)]
        public string? Address { get; set; }

        [StringLength(20)]
        public string? Mobile { get; set; }

        [StringLength(100)]
        public string? Website { get; set; }

        [StringLength(100)]
        [EmailAddress]
        public string? Email { get; set; }

        [StringLength(50)]
        public string? TaxId { get; set; }

        [StringLength(50)]
        public string? RegistrationNumber { get; set; }

        [StringLength(10)]
        public string Currency { get; set; } = "BDT";
        
        [StringLength(5)]
        public string CurrencySymbol { get; set; } = "৳";
    }
}
