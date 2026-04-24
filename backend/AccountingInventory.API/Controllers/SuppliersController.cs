using AccountingInventory.Core.DTOs;
using AccountingInventory.Core.Entities;
using AccountingInventory.Core.Interfaces;
using AccountingInventory.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AccountingInventory.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SuppliersController : ControllerBase
    {
        private readonly IGenericRepository<Supplier> _repository;
        private readonly ApplicationDbContext _context;

        public SuppliersController(IGenericRepository<Supplier> repository, ApplicationDbContext context)
        {
            _repository = repository;
            _context = context;
        }

        /// <summary>
        /// Gets all suppliers.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<Pagination<Supplier>>> GetSuppliers([FromQuery] BaseSpecParams specParams)
        {
            return Ok(await _repository.ListAsync(specParams, null, "Name"));
        }

        /// <summary>
        /// Gets a supplier by ID.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<Supplier>> GetSupplier(int id)
        {
            var supplier = await _repository.GetByIdAsync(id);
            if (supplier == null) return NotFound();
            return Ok(supplier);
        }

        /// <summary>
        /// Creates a new supplier.
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<Supplier>> CreateSupplier(CreatePartyDto dto)
        {
            var supplier = new Supplier
            {
                Name = dto.Name,
                Phone = dto.Phone,
                Email = dto.Email,
                Address = dto.Address
            };

            await _repository.AddAsync(supplier);
            return CreatedAtAction(nameof(GetSupplier), new { id = supplier.Id }, supplier);
        }

        /// <summary>
        /// Updates a supplier.
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSupplier(int id, CreatePartyDto dto)
        {
            var supplier = await _repository.GetByIdAsync(id);
            if (supplier == null) return NotFound();

            supplier.Name = dto.Name;
            supplier.Phone = dto.Phone;
            supplier.Email = dto.Email;
            supplier.Address = dto.Address;

            await _repository.UpdateAsync(supplier);
            return NoContent();
        }

        /// <summary>
        /// Deletes a supplier.
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSupplier(int id)
        {
            var supplier = await _repository.GetByIdAsync(id);
            if (supplier == null) return NotFound();

            // Check if supplier has any references in Purchases
            var hasPurchases = await _context.Purchases.AnyAsync(p => p.SupplierId == id);
            if (hasPurchases)
            {
                return BadRequest("Cannot delete supplier because they have associated purchase records.");
            }

            await _repository.DeleteAsync(supplier);
            return NoContent();
        }
    }
}
