using AccountingInventory.Core.Entities;
using AccountingInventory.Core.Interfaces;
using AccountingInventory.Infrastructure.Data;
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
        public async Task<ActionResult<IReadOnlyList<Account>>> GetAccounts()
        {
            return Ok(await _repository.GetAllAsync());
        }

        [HttpPost]
        public async Task<ActionResult<Account>> CreateAccount(Account account)
        {
            await _repository.AddAsync(account);
            return CreatedAtAction(nameof(GetAccounts), new { id = account.Id }, account);
        }

        /// <summary>
        /// Adds a manual transaction (Journal Entry).
        /// </summary>
        [HttpPost("transaction")]
        public async Task<IActionResult> AddTransaction(Transaction transaction)
        {
            var account = await _repository.GetByIdAsync(transaction.AccountId);
            if (account == null) return NotFound("Account not found");

            transaction.Date = DateTime.UtcNow;
            _context.Transactions.Add(transaction);

            // Update balance based on Debit/Credit
            // Asset/Expense: Debit increases, Credit decreases
            // Liability/Income/Equity: Credit increases, Debit decreases
            
            bool isDebitIncrease = account.Type == AccountType.Asset || account.Type == AccountType.Expense;

            if (isDebitIncrease)
            {
                account.Balance += transaction.Debit;
                account.Balance -= transaction.Credit;
            }
            else
            {
                account.Balance += transaction.Credit;
                account.Balance -= transaction.Debit;
            }

            await _context.SaveChangesAsync();
            return Ok(transaction);
        }

        [HttpGet("{id}/ledger")]
        public async Task<ActionResult<IEnumerable<Transaction>>> GetLedger(int id)
        {
            var transactions = await _context.Transactions
                .Where(t => t.AccountId == id)
                .OrderByDescending(t => t.Date)
                .ToListAsync();
            return Ok(transactions);
        }
    }
}
