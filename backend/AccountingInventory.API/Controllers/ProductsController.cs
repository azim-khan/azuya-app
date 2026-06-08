using AccountingInventory.Core.DTOs;
using AccountingInventory.Core.Entities;
using AccountingInventory.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AccountingInventory.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly IProductRepository _repository;
        private readonly IActivityLogService _activityLogService;

        public ProductsController(IProductRepository repository, IActivityLogService activityLogService)
        {
            _repository = repository;
            _activityLogService = activityLogService;
        }

        /// <summary>
        /// Gets all products with category and unit details (paginated, sorted, filtered).
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<Pagination<ProductDto>>> GetProducts([FromQuery] ProductSpecParams specParams)
        {
            var result = await _repository.GetProductsWithDetailsAsync(specParams);
            
            var dtos = result.Data.Select(p => new ProductDto
            {
                Id = p.Id,
                Name = p.Name,
                SKU = p.SKU,
                CategoryId = p.CategoryId,
                UnitId = p.UnitId,
                PurchasePrice = p.PurchasePrice,
                SalePrice = p.SalePrice,
                StockQuantity = p.StockQuantity,
                BrandId = p.BrandId,
                BrandName = p.Brand?.Name ?? "",
                Model = p.Model,
                CategoryName = p.Category?.Name ?? "",
                UnitName = p.Unit?.Name ?? ""
            }).ToList();

            var paginatedDtos = new Pagination<ProductDto>(result.PageIndex, result.PageSize, result.Count, dtos);
            return Ok(paginatedDtos);
        }

        /// <summary>
        /// Gets a product by ID.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ProductDto>> GetProduct(long id)
        {
            var product = await _repository.GetProductWithDetailsAsync(id);
            if (product == null) return NotFound();

            var dto = new ProductDto
            {
                Id = product.Id,
                Name = product.Name,
                SKU = product.SKU,
                CategoryId = product.CategoryId,
                UnitId = product.UnitId,
                PurchasePrice = product.PurchasePrice,
                SalePrice = product.SalePrice,
                StockQuantity = product.StockQuantity,
                BrandId = product.BrandId,
                BrandName = product.Brand?.Name ?? "",
                Model = product.Model,
                CategoryName = product.Category?.Name ?? "",
                UnitName = product.Unit?.Name ?? ""
            };

            return Ok(dto);
        }

        /// <summary>
        /// Creates a new product.
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<Product>> CreateProduct(CreateProductDto dto)
        {
            var product = new Product
            {
                Name = dto.Name,
                SKU = dto.SKU,
                CategoryId = dto.CategoryId,
                UnitId = dto.UnitId,
                BrandId = dto.BrandId,
                Model = dto.Model,
                PurchasePrice = dto.PurchasePrice,
                SalePrice = dto.SalePrice,
                StockQuantity = dto.StockQuantity
            };

            await _repository.AddAsync(product);

            await _activityLogService.LogActivityAsync(ActivityAction.Create, ActivityEntity.Product, product.Id.ToString(), $"Created product {product.Name} (SKU: {product.SKU})", dto);

            return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
        }

        /// <summary>
        /// Updates a product.
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProduct(long id, CreateProductDto dto)
        {
            var product = await _repository.GetByIdAsync(id);
            if (product == null) return NotFound();

            product.Name = dto.Name;
            product.SKU = dto.SKU;
            product.CategoryId = dto.CategoryId;
            product.UnitId = dto.UnitId;
            product.UnitId = dto.UnitId;
            product.BrandId = dto.BrandId;
            product.Model = dto.Model;
            product.PurchasePrice = dto.PurchasePrice;
            product.SalePrice = dto.SalePrice;
            product.StockQuantity = dto.StockQuantity;

            await _repository.UpdateAsync(product);

            await _activityLogService.LogActivityAsync(ActivityAction.Update, ActivityEntity.Product, product.Id.ToString(), $"Updated product {product.Name} (SKU: {product.SKU})", dto);

            return NoContent();
        }

        /// <summary>
        /// Deletes a product.
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(long id)
        {
            var product = await _repository.GetByIdAsync(id);
            if (product == null) return NotFound();

            try
            {
                await _repository.DeleteAsync(product);

                await _activityLogService.LogActivityAsync(ActivityAction.Delete, ActivityEntity.Product, product.Id.ToString(), $"Deleted product {product.Name} (SKU: {product.SKU})");

                return NoContent();
            }
            catch (Exception)
            {
                return BadRequest("Cannot delete product because it is being used in sales or purchases.");
            }
        }
    }
}
