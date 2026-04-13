using AccountingInventory.Core.DTOs;
using AccountingInventory.Core.Entities;
using AccountingInventory.Core.Interfaces;
using AccountingInventory.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AccountingInventory.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BrandsController : ControllerBase
    {
        private readonly IGenericRepository<Brand> _brandRepository;
        private readonly ApplicationDbContext _context;

        public BrandsController(IGenericRepository<Brand> brandRepository, ApplicationDbContext context)
        {
            _brandRepository = brandRepository;
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<Brand>>> GetBrands()
        {
            return Ok(await _brandRepository.GetAllAsync());
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Brand>> GetBrand(int id)
        {
            var brand = await _brandRepository.GetByIdAsync(id);
            if (brand == null) return NotFound();
            return Ok(brand);
        }

        [HttpPost]
        public async Task<ActionResult<Brand>> CreateBrand(CreateBrandDto dto)
        {
            var brand = new Brand
            {
                Name = dto.Name,
                Description = dto.Description ?? string.Empty
            };

            var createdBrand = await _brandRepository.AddAsync(brand);
            return CreatedAtAction(nameof(GetBrand), new { id = createdBrand.Id }, createdBrand);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateBrand(int id, CreateBrandDto dto)
        {
            var brand = await _brandRepository.GetByIdAsync(id);
            if (brand == null) return NotFound();

            brand.Name = dto.Name;
            brand.Description = dto.Description ?? string.Empty;

            await _brandRepository.UpdateAsync(brand);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBrand(int id)
        {
            var brand = await _brandRepository.GetByIdAsync(id);
            if (brand == null) return NotFound();

            try
            {
                await _brandRepository.DeleteAsync(brand);
                return NoContent();
            }
            catch (Exception)
            {
                return BadRequest("Cannot delete brand because it is being used by one or more products.");
            }
        }
    }
}
