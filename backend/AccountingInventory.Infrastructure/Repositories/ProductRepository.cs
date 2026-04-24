using AccountingInventory.Core.DTOs;
using AccountingInventory.Core.Entities;
using AccountingInventory.Core.Interfaces;
using AccountingInventory.Infrastructure.Data;
using AccountingInventory.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;

namespace AccountingInventory.Infrastructure.Repositories
{
    public class ProductRepository : GenericRepository<Product>, IProductRepository
    {
        public ProductRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<Pagination<Product>> GetProductsWithDetailsAsync(ProductSpecParams specParams)
        {
            var query = _context.Products
                .Include(p => p.Category)
                .Include(p => p.Unit)
                .Include(p => p.Brand)
                .AsQueryable();

            if (!string.IsNullOrEmpty(specParams.Search))
            {
                query = query.Where(p => 
                    p.Name.ToLower().Contains(specParams.Search) ||
                    p.SKU.ToLower().Contains(specParams.Search) ||
                    (p.Category != null && p.Category.Name.ToLower().Contains(specParams.Search)) ||
                    (p.Brand != null && p.Brand.Name.ToLower().Contains(specParams.Search)) ||
                    (p.Model != null && p.Model.ToLower().Contains(specParams.Search))
                );
            }

            var count = await query.CountAsync();

            var data = await query
                .ApplySorting(specParams, "Name")
                .ApplyPagination(specParams)
                .ToListAsync();

            return new Pagination<Product>(specParams.PageIndex, specParams.PageSize, count, data);
        }

        public async Task<Product?> GetProductWithDetailsAsync(int id)
        {
            return await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Unit)
                .Include(p => p.Brand)
                .FirstOrDefaultAsync(p => p.Id == id);
        }
    }
}
