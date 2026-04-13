using AccountingInventory.Core.DTOs;
using AccountingInventory.Core.Entities;
using AccountingInventory.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AccountingInventory.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UnitsController : ControllerBase
    {
        private readonly IGenericRepository<Unit> _repository;

        public UnitsController(IGenericRepository<Unit> repository)
        {
            _repository = repository;
        }

        /// <summary>
        /// Gets all units.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<Unit>>> GetUnits()
        {
            return Ok(await _repository.GetAllAsync());
        }

        /// <summary>
        /// Gets a unit by ID.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<Unit>> GetUnit(int id)
        {
            var unit = await _repository.GetByIdAsync(id);
            if (unit == null) return NotFound();
            return Ok(unit);
        }

        /// <summary>
        /// Creates a new unit.
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<Unit>> CreateUnit(CreateUnitDto dto)
        {
            var unit = new Unit 
            { 
                Name = dto.Name,
                Symbol = dto.Symbol
            };
            await _repository.AddAsync(unit);
            return CreatedAtAction(nameof(GetUnit), new { id = unit.Id }, unit);
        }

        /// <summary>
        /// Updates a unit.
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUnit(int id, CreateUnitDto dto)
        {
            var unit = await _repository.GetByIdAsync(id);
            if (unit == null) return NotFound();

            unit.Name = dto.Name;
            unit.Symbol = dto.Symbol;
            await _repository.UpdateAsync(unit);
            return NoContent();
        }

        /// <summary>
        /// Deletes a unit.
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUnit(int id)
        {
            var unit = await _repository.GetByIdAsync(id);
            if (unit == null) return NotFound();

            try
            {
                await _repository.DeleteAsync(unit);
                return NoContent();
            }
            catch (Exception)
            {
                return BadRequest("Cannot delete unit because it is being used by one or more products.");
            }
        }
    }
}
