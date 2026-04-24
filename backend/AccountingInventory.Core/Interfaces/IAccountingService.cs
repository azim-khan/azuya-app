using AccountingInventory.Core.Entities;
using System.Threading.Tasks;

namespace AccountingInventory.Core.Interfaces
{
    public interface IAccountingService
    {
        Task<JournalEntry> CreateSaleJournalEntryAsync(Sale sale, int paymentAccountId);
        Task<JournalEntry> CreatePurchaseJournalEntryAsync(Purchase purchase, int paymentAccountId);
        Task DeleteJournalEntryByReferenceAsync(string referenceNo);
        Task UpdateSaleJournalEntryAsync(Sale sale, int paymentAccountId);
        Task UpdatePurchaseJournalEntryAsync(Purchase purchase, int paymentAccountId);
    }
}
