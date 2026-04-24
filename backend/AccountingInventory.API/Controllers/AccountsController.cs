using AccountingInventory.Core.Entities;
using AccountingInventory.Core.Interfaces;
using AccountingInventory.Infrastructure.Data;
using AccountingInventory.Core.DTOs;
using AccountingInventory.Infrastructure.Extensions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AccountingInventory.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountsController : ControllerBase
    {
        private readonly IGenericRepository<Account> _repository;
        private readonly ApplicationDbContext _context;

        public AccountsController(IGenericRepository<Account> repository, ApplicationDbContext context)
        {
            _repository = repository;
            _context = context;
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

        [HttpPost]
        public async Task<ActionResult<Account>> CreateAccount(Account account)
        {
            await _repository.AddAsync(account);
            return CreatedAtAction(nameof(GetAccounts), new { id = account.Id }, account);
        }

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
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAccount(int id)
        {
            var account = await _context.Accounts.FindAsync(id);
            if (account == null) return NotFound();
            
            if (account.IsSystemAccount) return BadRequest("System accounts cannot be deleted.");
            
            _context.Accounts.Remove(account);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("{id}/ledger")]
        public async Task<ActionResult<IEnumerable<LedgerEntry>>> GetLedger(int id)
        {
            var entries = await _context.LedgerEntries
                .Include(l => l.JournalEntry)
                .Where(l => l.AccountId == id)
                .OrderByDescending(l => l.JournalEntry!.Date)
                .ToListAsync();
            return Ok(entries);
        }

        [HttpGet("journal")]
        public async Task<ActionResult<IEnumerable<JournalEntry>>> GetJournal()
        {
            return Ok(await _context.JournalEntries
                .Include(j => j.Entries)
                .ThenInclude(e => e.Account)
                .OrderByDescending(j => j.Date)
                .ToListAsync());
        }
    }
}
