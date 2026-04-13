using AccountingInventory.Core.DTOs;
using AccountingInventory.Core.Entities;
using AccountingInventory.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AccountingInventory.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriesController : ControllerBase
    {
        private readonly IGenericRepository<Category> _repository;

        public CategoriesController(IGenericRepository<Category> repository)
        {
            _repository = repository;
        }

        /// <summary>
        /// Gets all categories.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<Category>>> GetCategories()
        {
            return Ok(await _repository.GetAllAsync());
        }

        /// <summary>
        /// Gets a category by ID.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<Category>> GetCategory(int id)
        {
            var category = await _repository.GetByIdAsync(id);
            if (category == null) return NotFound();
            return Ok(category);
        }

        /// <summary>
        /// Creates a new category.
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<Category>> CreateCategory(CreateCategoryDto dto)
        {
            var category = new Category
            {
                Name = dto.Name,
                Code = dto.Code,
                Description = dto.Description
            };

            await _repository.AddAsync(category);
            return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, category);
        }

        /// <summary>
        /// Updates a category.
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCategory(int id, CreateCategoryDto dto)
        {
            var category = await _repository.GetByIdAsync(id);
            if (category == null) return NotFound();

            category.Name = dto.Name;
            category.Code = dto.Code;
            category.Description = dto.Description;

            await _repository.UpdateAsync(category);
            return NoContent();
        }

        /// <summary>
        /// Deletes a category.
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _repository.GetByIdAsync(id);
            if (category == null) return NotFound();

            try
            {
                await _repository.DeleteAsync(category);
                return NoContent();
            }
            catch (Exception)
            {
                return BadRequest("Cannot delete category because it is being used by one or more products.");
            }
        }
    }
}
