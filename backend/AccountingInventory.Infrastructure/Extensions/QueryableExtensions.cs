using System.Linq.Expressions;
using AccountingInventory.Core.DTOs;
using Microsoft.EntityFrameworkCore;

namespace AccountingInventory.Infrastructure.Extensions
{
    public static class QueryableExtensions
    {
        public static IQueryable<T> ApplySorting<T>(this IQueryable<T> query, BaseSpecParams specParams, string? defaultSort = null)
        {
            if (string.IsNullOrEmpty(specParams.Sort) && string.IsNullOrEmpty(defaultSort))
            {
                return query;
            }

            var sortProperty = string.IsNullOrEmpty(specParams.Sort) ? defaultSort?.Split(' ')[0] : specParams.Sort;
            var isDescending = false;

            if (!string.IsNullOrEmpty(specParams.SortOrder))
            {
                isDescending = specParams.SortOrder.ToLower() == "desc";
            }
            else
            {
                var sortParts = defaultSort?.Split(' ');
                var dir = sortParts?.Length > 1 ? sortParts[1].ToLower() : null;
                isDescending = dir == "desc";
            }

            try
            {
                return isDescending ? query.OrderByDescending(sortProperty!) : query.OrderBy(sortProperty!);
            }
            catch
            {
                // Fallback to default sort if the property name is invalid or not sortable directly
                return query;
            }
        }

        public static IQueryable<T> ApplyPagination<T>(this IQueryable<T> query, BaseSpecParams specParams)
        {
            return query
                .Skip((specParams.PageIndex - 1) * specParams.PageSize)
                .Take(specParams.PageSize);
        }

        // Simple reflection-based OrderBy to handle string property names
        private static IQueryable<T> OrderBy<T>(this IQueryable<T> source, string propertyName)
        {
            return source.OrderByCustom(propertyName, false);
        }

        private static IQueryable<T> OrderByDescending<T>(this IQueryable<T> source, string propertyName)
        {
            return source.OrderByCustom(propertyName, true);
        }

        private static IQueryable<T> OrderByCustom<T>(this IQueryable<T> source, string propertyName, bool descending)
        {
            if (string.IsNullOrEmpty(propertyName)) return source;

            var type = typeof(T);
            var parameter = Expression.Parameter(type, "p");
            Expression propertyAccess;

            try
            {
                // Handle nested properties like "Customer.Name"
                if (propertyName.Contains("."))
                {
                    propertyAccess = parameter;
                    foreach (var part in propertyName.Split('.'))
                    {
                        var property = propertyAccess.Type.GetProperty(part, System.Reflection.BindingFlags.IgnoreCase | System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
                        if (property == null) return source; // Property not found
                        propertyAccess = Expression.Property(propertyAccess, property);
                    }
                }
                else
                {
                    var property = type.GetProperty(propertyName, System.Reflection.BindingFlags.IgnoreCase | System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
                    if (property == null) return source; // Property not found
                    propertyAccess = Expression.Property(parameter, property);
                }
            }
            catch
            {
                return source; // Safety fallback
            }

            var orderByExpression = Expression.Lambda(propertyAccess, parameter);
            var methodName = descending ? "OrderByDescending" : "OrderBy";

            var resultExpression = Expression.Call(
                typeof(Queryable),
                methodName,
                new Type[] { type, propertyAccess.Type },
                source.Expression,
                Expression.Quote(orderByExpression)
            );

            return source.Provider.CreateQuery<T>(resultExpression);
        }
    }
}
