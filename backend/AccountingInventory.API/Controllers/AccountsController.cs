using AccountingInventory.Core.Entities;
using AccountingInventory.Core.Interfaces;
using AccountingInventory.Infrastructure.Data;
using AccountingInventory.Core.DTOs;
using AccountingInventory.Infrastructure.Extensions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace AccountingInventory.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountsController : ControllerBase
    {
        private readonly IGenericRepository<Account> _repository;
        private readonly ApplicationDbContext _context;
        private readonly IActivityLogService _activityLogService;

        public AccountsController(IGenericRepository<Account> repository, ApplicationDbContext context, IActivityLogService activityLogService)
        {
            _repository = repository;
            _context = context;
            _activityLogService = activityLogService;
        }
        [HttpGet]
        public async Task<ActionResult<Pagination<Account>>> GetAccounts([FromQuery] ReportParams reportParams)
        {
            var query = _context.Accounts.AsQueryable();

            if (!string.IsNullOrEmpty(reportParams.Search))
            {
                query = query.Where(a => a.Name.Contains(reportParams.Search));
            }

            var count = await query.CountAsync();

            var accounts = await query
                .ApplySorting(reportParams, "Name asc")
                .ApplyPagination(reportParams)
                .ToListAsync();

            return Ok(new Pagination<Account>(reportParams.PageIndex, reportParams.PageSize, count, accounts));
        }

        [Authorize(Roles = "SuperAdmin,Admin")]
        [HttpPost]
        public async Task<ActionResult<Account>> CreateAccount(CreateAccountDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var account = new Account
                {
                    Name = dto.Name,
                    Type = dto.Type,
                    Balance = dto.OpeningBalance
                };

                await _repository.AddAsync(account);

                if (dto.OpeningBalance != 0)
                {
                    var openingBalanceEquity = await _context.Accounts
                        .FirstOrDefaultAsync(a => a.Name == SystemAccount.OpeningBalanceEquity);

                    if (openingBalanceEquity == null)
                    {
                        openingBalanceEquity = new Account
                        {
                            Name = SystemAccount.OpeningBalanceEquity,
                            Type = AccountType.Equity,
                            IsSystemAccount = true,
                            Balance = 0
                        };
                        _context.Accounts.Add(openingBalanceEquity);
                        await _context.SaveChangesAsync(); // Get the ID
                    }

                    var journalEntry = new JournalEntry
                    {
                        Date = DateTime.UtcNow,
                        Description = $"Opening balance for {account.Name}",
                        ReferenceNo = "OB",
                        SourceType = "Opening Balance"
                    };

                    bool isDebitAccount = account.Type == AccountType.Asset || account.Type == AccountType.Expense;

                    // If it's an Asset/Expense, we Debit it to increase balance.
                    // If it's Liability/Equity/Income, we Credit it to increase balance.

                    journalEntry.Entries.Add(new LedgerEntry
                    {
                        AccountId = account.Id,
                        Debit = isDebitAccount ? Math.Abs(dto.OpeningBalance) : 0,
                        Credit = !isDebitAccount ? Math.Abs(dto.OpeningBalance) : 0
                    });

                    journalEntry.Entries.Add(new LedgerEntry
                    {
                        AccountId = openingBalanceEquity.Id,
                        Debit = !isDebitAccount ? Math.Abs(dto.OpeningBalance) : 0,
                        Credit = isDebitAccount ? Math.Abs(dto.OpeningBalance) : 0
                    });

                    _context.JournalEntries.Add(journalEntry);

                    // Update Equity balance
                    if (isDebitAccount) openingBalanceEquity.Balance -= dto.OpeningBalance;
                    else openingBalanceEquity.Balance += dto.OpeningBalance;
                }

                await _context.SaveChangesAsync();

                await _activityLogService.LogActivityAsync("Create", "Account", account.Id.ToString(), $"Created account {account.Name}", dto);

                await transaction.CommitAsync();

                return CreatedAtAction(nameof(GetAccounts), new { id = account.Id }, account);
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        [Authorize(Roles = "SuperAdmin,Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAccount(int id, Account account)
        {
            var existing = await _context.Accounts.FindAsync(id);
            if (existing == null) return NotFound();

            if (existing.IsSystemAccount)
            {
                // Only allow updating balance manually if needed? 
                // Usually system account names/types are locked.
                return BadRequest("System accounts cannot be renamed or retyped.");
            }

            existing.Name = account.Name;
            existing.Type = account.Type;

            await _context.SaveChangesAsync();

            await _activityLogService.LogActivityAsync("Update", "Account", existing.Id.ToString(), $"Updated account {existing.Name}", account);

            return NoContent();
        }

        [Authorize(Roles = "SuperAdmin,Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAccount(int id)
        {
            var account = await _context.Accounts.FindAsync(id);
            if (account == null) return NotFound();

            if (account.IsSystemAccount) return BadRequest("System accounts cannot be deleted.");

            _context.Accounts.Remove(account);
            await _context.SaveChangesAsync();

            await _activityLogService.LogActivityAsync("Delete", "Account", account.Id.ToString(), $"Deleted account {account.Name}");

            return NoContent();
        }

        [HttpGet("{id}/ledger")]
        public async Task<ActionResult<Pagination<LedgerEntry>>> GetLedger(int id, [FromQuery] ReportParams reportParams)
        {
            var query = _context.LedgerEntries
                .Include(l => l.JournalEntry)
                .Where(l => l.AccountId == id)
                .AsQueryable();

            if (reportParams.StartDate.HasValue)
            {
                query = query.Where(l => l.JournalEntry!.Date >= reportParams.StartDate.Value);
            }

            if (reportParams.EndDate.HasValue)
            {
                var end = reportParams.EndDate.Value.Date.AddDays(1).AddTicks(-1);
                query = query.Where(l => l.JournalEntry!.Date <= end);
            }

            var count = await query.CountAsync();

            var entries = await query
                .OrderByDescending(l => l.JournalEntry!.Date)
                .ApplyPagination(reportParams)
                .ToListAsync();

            return Ok(new Pagination<LedgerEntry>(reportParams.PageIndex, reportParams.PageSize, count, entries));
        }

        [HttpGet("report/transactions")]
        public async Task<ActionResult<Pagination<LedgerEntry>>> GetAccountTransactionsReport([FromQuery] ReportParams reportParams)
        {
            var query = _context.LedgerEntries
                .Include(l => l.Account)
                .Include(l => l.JournalEntry)
                .AsQueryable();

            if (reportParams.AccountId.HasValue)
            {
                query = query.Where(l => l.AccountId == reportParams.AccountId.Value);
            }

            if (reportParams.StartDate.HasValue)
            {
                query = query.Where(l => l.JournalEntry!.Date >= reportParams.StartDate.Value);
            }

            if (reportParams.EndDate.HasValue)
            {
                var end = reportParams.EndDate.Value.Date.AddDays(1).AddTicks(-1);
                query = query.Where(l => l.JournalEntry!.Date <= end);
            }

            if (!string.IsNullOrEmpty(reportParams.Search))
            {
                query = query.Where(l => l.JournalEntry!.Description.Contains(reportParams.Search) || 
                                         l.JournalEntry!.ReferenceNo.Contains(reportParams.Search));
            }

            var count = await query.CountAsync();

            var entries = await query
                .OrderByDescending(l => l.JournalEntry!.Date)
                .ApplyPagination(reportParams)
                .ToListAsync();

            return Ok(new Pagination<LedgerEntry>(reportParams.PageIndex, reportParams.PageSize, count, entries));
        }

        [HttpGet("journal")]
        public async Task<ActionResult<Pagination<JournalEntry>>> GetJournal([FromQuery] ReportParams reportParams)
        {
            var query = _context.JournalEntries
                .Include(j => j.Entries)
                .ThenInclude(e => e.Account)
                .AsQueryable();

            if (!string.IsNullOrEmpty(reportParams.Search))
            {
                query = query.Where(j => j.Description.Contains(reportParams.Search) || j.ReferenceNo.Contains(reportParams.Search));
            }

            if (reportParams.StartDate.HasValue)
            {
                query = query.Where(j => j.Date >= reportParams.StartDate.Value);
            }

            if (reportParams.EndDate.HasValue)
            {
                var end = reportParams.EndDate.Value.Date.AddDays(1).AddTicks(-1);
                query = query.Where(j => j.Date <= end);
            }
            
            if (reportParams.AccountId.HasValue)
            {
                query = query.Where(j => j.Entries.Any(e => e.AccountId == reportParams.AccountId.Value));
            }

            var count = await query.CountAsync();

            var entries = await query
                .OrderByDescending(j => j.Date)
                .ApplyPagination(reportParams)
                .ToListAsync();

            return Ok(new Pagination<JournalEntry>(reportParams.PageIndex, reportParams.PageSize, count, entries));
        }

        [Authorize(Roles = "SuperAdmin,Admin")]
        [HttpPost("journal")]
        public async Task<IActionResult> CreateManualJournalEntry(ManualJournalEntryDto dto)
        {
            if (dto.Items.Sum(x => x.Debit) != dto.Items.Sum(x => x.Credit))
            {
                return BadRequest("Total Debits must equal Total Credits.");
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var journalEntry = new JournalEntry
                {
                    Date = dto.Date,
                    Description = dto.Description,
                    ReferenceNo = dto.ReferenceNo,
                    SourceType = "Manual"
                };

                foreach (var item in dto.Items)
                {
                    var account = await _context.Accounts.FindAsync(item.AccountId);
                    if (account == null) return BadRequest($"Account with ID {item.AccountId} not found.");

                    journalEntry.Entries.Add(new LedgerEntry
                    {
                        AccountId = item.AccountId,
                        Debit = item.Debit,
                        Credit = item.Credit
                    });

                    // Update account balance
                    bool isDebitAccount = account.Type == AccountType.Asset || account.Type == AccountType.Expense;
                    if (isDebitAccount) account.Balance += (item.Debit - item.Credit);
                    else account.Balance += (item.Credit - item.Debit);
                }

                _context.JournalEntries.Add(journalEntry);
                await _context.SaveChangesAsync();

                await _activityLogService.LogActivityAsync("Create", "ManualJournal", journalEntry.Id.ToString(), $"Created manual journal entry: {journalEntry.Description}", dto);

                await transaction.CommitAsync();

                return Ok(journalEntry);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, ex.Message);
            }
        }

        [Authorize(Roles = "SuperAdmin,Admin")]
        [HttpPost("{id}/adjust")]
        public async Task<IActionResult> AdjustAccount(int id, [FromBody] AccountAdjustmentDto dto)
        {
            var account = await _context.Accounts.FindAsync(id);
            if (account == null) return NotFound();

            var counterpartAccount = await _context.Accounts.FindAsync(dto.CounterpartAccountId);
            if (counterpartAccount == null) return BadRequest("Counterpart account not found.");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var journalEntry = new JournalEntry
                {
                    Date = DateTime.UtcNow,
                    Description = dto.Description,
                    ReferenceNo = "ADJ",
                    SourceType = "Adjustment"
                };

                bool isDebitAccount = account.Type == AccountType.Asset || account.Type == AccountType.Expense;
                bool isCounterpartDebitAccount = counterpartAccount.Type == AccountType.Asset || counterpartAccount.Type == AccountType.Expense;

                // Create ledger entries
                journalEntry.Entries.Add(new LedgerEntry
                {
                    AccountId = account.Id,
                    Debit = isDebitAccount ? dto.Amount : 0,
                    Credit = !isDebitAccount ? dto.Amount : 0
                });

                journalEntry.Entries.Add(new LedgerEntry
                {
                    AccountId = counterpartAccount.Id,
                    Debit = !isDebitAccount ? dto.Amount : 0,
                    Credit = isDebitAccount ? dto.Amount : 0
                });

                // Update balances
                account.Balance += dto.Amount; // In this context, 'Amount' is the net increase (positive) or decrease (negative)
                // But wait, it's better to explicitly use Debit/Credit logic for the counterpart
                if (isDebitAccount)
                {
                    // If we debited account (increasing it), we must credit counterpart.
                    // If we credited account (decreasing it), we must debit counterpart.
                    if (isCounterpartDebitAccount) counterpartAccount.Balance -= dto.Amount;
                    else counterpartAccount.Balance += dto.Amount;
                }
                else
                {
                    // If we credited account (increasing it), we must debit counterpart.
                    // If we debited account (decreasing it), we must credit counterpart.
                    if (isCounterpartDebitAccount) counterpartAccount.Balance += dto.Amount;
                    else counterpartAccount.Balance -= dto.Amount;
                }

                _context.JournalEntries.Add(journalEntry);
                await _context.SaveChangesAsync();

                await _activityLogService.LogActivityAsync("Adjustment", "Account", account.Id.ToString(), $"Adjusted account {account.Name}: {dto.Description}", dto);

                await transaction.CommitAsync();

                return Ok();
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, ex.Message);
            }
        }
    }
}
