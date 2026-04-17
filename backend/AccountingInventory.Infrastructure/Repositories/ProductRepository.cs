using AccountingInventory.Core.DTOs;
using AccountingInventory.Core.Entities;
using AccountingInventory.Core.Interfaces;
using AccountingInventory.Infrastructure.Data;
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

            if (!string.IsNullOrEmpty(specParams.Sort))
            {
                bool isDesc = specParams.SortOrder == "desc";
                switch (specParams.Sort.ToLower())
                {
                    case "name":
                        query = isDesc ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name);
                        break;
                    case "sku":
                        query = isDesc ? query.OrderByDescending(p => p.SKU) : query.OrderBy(p => p.SKU);
                        break;
                    case "purchaseprice":
                        query = isDesc ? query.OrderByDescending(p => p.PurchasePrice) : query.OrderBy(p => p.PurchasePrice);
                        break;
                    case "saleprice":
                        query = isDesc ? query.OrderByDescending(p => p.SalePrice) : query.OrderBy(p => p.SalePrice);
                        break;
                    case "stockquantity":
                        query = isDesc ? query.OrderByDescending(p => p.StockQuantity) : query.OrderBy(p => p.StockQuantity);
                        break;
                    case "categoryname":
                        query = isDesc ? query.OrderByDescending(p => p.Category!.Name) : query.OrderBy(p => p.Category!.Name);
                        break;
                    case "brandname":
                        query = isDesc ? query.OrderByDescending(p => p.Brand!.Name) : query.OrderBy(p => p.Brand!.Name);
                        break;
                    case "model":
                        query = isDesc ? query.OrderByDescending(p => p.Model) : query.OrderBy(p => p.Model);
                        break;
                    default:
                        query = isDesc ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name);
                        break;
                }
            }
            else
            {
                query = query.OrderBy(p => p.Name);
            }

            var count = await query.CountAsync();

            var data = await query
                .Skip((specParams.PageIndex - 1) * specParams.PageSize)
                .Take(specParams.PageSize)
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
