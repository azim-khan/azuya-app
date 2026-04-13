using AccountingInventory.Core.DTOs;
using AccountingInventory.Core.Entities;

namespace AccountingInventory.Core.Interfaces
{
    public interface IProductRepository : IGenericRepository<Product>
    {
        Task<Pagination<Product>> GetProductsWithDetailsAsync(ProductSpecParams specParams);
        Task<Product?> GetProductWithDetailsAsync(int id);
    }
}
