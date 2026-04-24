using AccountingInventory.Core.Entities;
using AccountingInventory.Core.Interfaces;
using AccountingInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AccountingInventory.Infrastructure.Services
{
    public class AccountingService : IAccountingService
    {
        private readonly ApplicationDbContext _context;

        public AccountingService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<JournalEntry> CreateSaleJournalEntryAsync(Sale sale, int paymentAccountId)
        {
            var journal = new JournalEntry
            {
                Date = sale.Date,
                ReferenceNo = sale.InvoiceNo,
                SourceType = "Sale",
                Description = $"Sale transaction for invoice {sale.InvoiceNo}"
            };

            // 1. Credit Sales Account (Income)
            await AddLedgerEntry(journal, "Sales", 0, sale.TotalAmount);

            // 2. Debit Payment Account (Cash/Bank) for the paid amount
            if (sale.PaidAmount > 0)
            {
                var paymentAccount = await _context.Accounts.FindAsync(paymentAccountId);
                if (paymentAccount == null) throw new Exception("Payment account not found.");
                await AddLedgerEntry(journal, paymentAccount.Id, sale.PaidAmount, 0);
            }

            // 3. Debit Accounts Receivable (Asset) for the due amount
            if (sale.DueAmount > 0)
            {
                await AddLedgerEntry(journal, "Accounts Receivable", sale.DueAmount, 0);
            }

            // 4. Handle COGS and Inventory (Perpetual Inventory)
            decimal totalCost = 0;
            foreach (var detail in sale.SaleDetails)
            {
                var product = await _context.Products.FindAsync(detail.ProductId);
                if (product != null)
                {
                    totalCost += detail.Quantity * product.PurchasePrice;
                }
            }

            if (totalCost > 0)
            {
                // Debit Expense/COGS
                await AddLedgerEntry(journal, "Expense", totalCost, 0);
                // Credit Inventory
                await AddLedgerEntry(journal, "Inventory", 0, totalCost);
            }

            _context.JournalEntries.Add(journal);
            return journal;
        }

        public async Task<JournalEntry> CreatePurchaseJournalEntryAsync(Purchase purchase, int paymentAccountId)
        {
            var journal = new JournalEntry
            {
                Date = purchase.Date,
                ReferenceNo = purchase.PurchaseNo,
                SourceType = "Purchase",
                Description = $"Purchase transaction {purchase.PurchaseNo}"
            };

            // 1. Debit Inventory (Asset)
            await AddLedgerEntry(journal, "Inventory", purchase.TotalAmount, 0);

            // 2. Credit Payment Account (Cash/Bank) for paid amount
            if (purchase.PaidAmount > 0)
            {
                var paymentAccount = await _context.Accounts.FindAsync(paymentAccountId);
                if (paymentAccount == null) throw new Exception("Payment account not found.");
                await AddLedgerEntry(journal, paymentAccount.Id, 0, purchase.PaidAmount);
            }

            // 3. Credit Accounts Payable (Liability) for due amount
            if (purchase.DueAmount > 0)
            {
                await AddLedgerEntry(journal, "Accounts Payable", 0, purchase.DueAmount);
            }

            _context.JournalEntries.Add(journal);
            return journal;
        }

        public async Task DeleteJournalEntryByReferenceAsync(string referenceNo)
        {
            var journal = await _context.JournalEntries
                .Include(j => j.Entries)
                .FirstOrDefaultAsync(j => j.ReferenceNo == referenceNo);

            if (journal != null)
            {
                // Reverse account balances before deleting
                foreach (var entry in journal.Entries)
                {
                    var account = await _context.Accounts.FindAsync(entry.AccountId);
                    if (account != null)
                    {
                        // To reverse: subtract debit, add credit
                        // But since we want to remove the impact:
                        // Asset/Expense: Balance = Balance - Debit + Credit
                        // Liability/Income/Equity: Balance = Balance + Debit - Credit
                        
                        if (account.Type == AccountType.Asset || account.Type == AccountType.Expense)
                        {
                            account.Balance -= entry.Debit;
                            account.Balance += entry.Credit;
                        }
                        else
                        {
                            account.Balance += entry.Debit;
                            account.Balance -= entry.Credit;
                        }
                    }
                }

                _context.LedgerEntries.RemoveRange(journal.Entries);
                _context.JournalEntries.Remove(journal);
            }
        }

        public async Task UpdateSaleJournalEntryAsync(Sale sale, int paymentAccountId)
        {
            await DeleteJournalEntryByReferenceAsync(sale.InvoiceNo);
            await CreateSaleJournalEntryAsync(sale, paymentAccountId);
        }

        public async Task UpdatePurchaseJournalEntryAsync(Purchase purchase, int paymentAccountId)
        {
            await DeleteJournalEntryByReferenceAsync(purchase.PurchaseNo);
            await CreatePurchaseJournalEntryAsync(purchase, paymentAccountId);
        }

        private async Task AddLedgerEntry(JournalEntry journal, string accountName, decimal debit, decimal credit)
        {
            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.Name == accountName);
            if (account == null) throw new Exception($"System account '{accountName}' not found.");
            
            await AddLedgerEntry(journal, account.Id, debit, credit);
        }

        private async Task AddLedgerEntry(JournalEntry journal, int accountId, decimal debit, decimal credit)
        {
            var account = await _context.Accounts.FindAsync(accountId);
            if (account == null) return;

            var entry = new LedgerEntry
            {
                AccountId = accountId,
                Debit = debit,
                Credit = credit
            };

            journal.Entries.Add(entry);

            // Update Account Balance
            if (account.Type == AccountType.Asset || account.Type == AccountType.Expense)
            {
                account.Balance += debit;
                account.Balance -= credit;
            }
            else
            {
                account.Balance -= debit;
                account.Balance += credit;
            }
        }
    }
}
