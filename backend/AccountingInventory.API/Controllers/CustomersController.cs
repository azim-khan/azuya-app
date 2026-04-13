using AccountingInventory.Core.DTOs;
using AccountingInventory.Core.Entities;
using AccountingInventory.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AccountingInventory.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CustomersController : ControllerBase
    {
        private readonly IGenericRepository<Customer> _repository;

        public CustomersController(IGenericRepository<Customer> repository)
        {
            _repository = repository;
        }

        /// <summary>
        /// Gets all customers.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<Customer>>> GetCustomers()
        {
            return Ok(await _repository.GetAllAsync());
        }

        /// <summary>
        /// Gets a customer by ID.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<Customer>> GetCustomer(int id)
        {
            var customer = await _repository.GetByIdAsync(id);
            if (customer == null) return NotFound();
            return Ok(customer);
        }

        /// <summary>
        /// Creates a new customer.
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<Customer>> CreateCustomer(CreatePartyDto dto)
        {
            var customer = new Customer
            {
                Name = dto.Name,
                Phone = dto.Phone,
                Email = dto.Email,
                Address = dto.Address
            };

            await _repository.AddAsync(customer);
            return CreatedAtAction(nameof(GetCustomer), new { id = customer.Id }, customer);
        }

        /// <summary>
        /// Updates a customer.
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCustomer(int id, CreatePartyDto dto)
        {
            var customer = await _repository.GetByIdAsync(id);
            if (customer == null) return NotFound();

            customer.Name = dto.Name;
            customer.Phone = dto.Phone;
            customer.Email = dto.Email;
            customer.Address = dto.Address;

            await _repository.UpdateAsync(customer);
            return NoContent();
        }

        /// <summary>
        /// Deletes a customer.
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCustomer(int id)
        {
            var customer = await _repository.GetByIdAsync(id);
            if (customer == null) return NotFound();

            await _repository.DeleteAsync(customer);
            return NoContent();
        }
    }
}
