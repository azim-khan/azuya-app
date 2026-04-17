using System.ComponentModel.DataAnnotations;

namespace AccountingInventory.Core.DTOs
{
    public class CreateCategoryDto
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class CreateUnitDto
    {
        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = string.Empty;
        public string Symbol { get; set; } = string.Empty;
    }

    public class CreateBrandDto
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class CreateProductDto
    {
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;
        public string SKU { get; set; } = string.Empty;
        [Required]
        public int CategoryId { get; set; }
        [Required]
        public int UnitId { get; set; }
        public int? BrandId { get; set; }
        public string Model { get; set; } = string.Empty;
        public decimal PurchasePrice { get; set; }
        public decimal SalePrice { get; set; }
        public decimal StockQuantity { get; set; }
    }

    public class ProductDto : CreateProductDto
    {
        public int Id { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string UnitName { get; set; } = string.Empty;
        public string BrandName { get; set; } = string.Empty;
    }
}
