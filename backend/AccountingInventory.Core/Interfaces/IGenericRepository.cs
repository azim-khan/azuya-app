using System.Linq.Expressions;
using AccountingInventory.Core.DTOs;
using AccountingInventory.Core.Entities;

namespace AccountingInventory.Core.Interfaces
{
    public interface IGenericRepository<T> where T : BaseEntity
    {
        Task<T?> GetByIdAsync(int id);
        Task<IReadOnlyList<T>> GetAllAsync();
        Task<IReadOnlyList<T>> FindAsync(Expression<Func<T, bool>> predicate);
        Task<T> AddAsync(T entity);
        Task UpdateAsync(T entity);
        Task DeleteAsync(T entity);
        Task<int> CountAsync(Expression<Func<T, bool>> predicate);
        Task<Pagination<T>> ListAsync(BaseSpecParams specParams, Expression<Func<T, bool>>? predicate = null, string defaultSort = "Id");
    }
}
