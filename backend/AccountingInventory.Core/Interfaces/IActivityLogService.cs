using AccountingInventory.Core.Entities;
using System.Threading.Tasks;

namespace AccountingInventory.Core.Interfaces
{
    public interface IActivityLogService
    {
        Task LogActivityAsync(ActivityAction action, ActivityEntity entityName, string entityId, string description, object? rawData = null);
    }
}
