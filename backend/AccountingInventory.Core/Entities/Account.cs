using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AccountingInventory.Core.Entities
{
    public enum AccountType
    {
        Asset,
        Liability,
        Equity,
        Income,
        Expense
    }

    public class Account : BaseEntity
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        public AccountType Type { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Balance { get; set; }
    }

    public class Transaction : BaseEntity
    {
        public int AccountId { get; set; }
        public Account? Account { get; set; }

        public DateTime Date { get; set; } = DateTime.UtcNow;
        
        [MaxLength(200)]
        public string Description { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Debit { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Credit { get; set; }
    }
}
