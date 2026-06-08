using AccountingInventory.Core.Entities;
using System.Threading.Tasks;

namespace AccountingInventory.Core.Interfaces
{
    public interface IAccountingService
    {
        Task<JournalEntry> CreateSaleJournalEntryAsync(Sale sale, long paymentAccountId);
        Task<JournalEntry> CreatePurchaseJournalEntryAsync(Purchase purchase, long paymentAccountId);
        Task DeleteJournalEntryByReferenceAsync(string referenceNo);
        Task UpdateSaleJournalEntryAsync(Sale sale, long paymentAccountId);
        Task UpdatePurchaseJournalEntryAsync(Purchase purchase, long paymentAccountId);
    }
}
