using AccountingInventory.Core.Entities;

namespace AccountingInventory.Core.DTOs
{
    public class CreateAccountDto
    {
        public string Name { get; set; } = string.Empty;
        public AccountType Type { get; set; }
        public decimal OpeningBalance { get; set; }
    }

    public class AccountAdjustmentDto
    {
        public decimal Amount { get; set; }
        public string Description { get; set; } = string.Empty;
        public long CounterpartAccountId { get; set; }
    }
}
