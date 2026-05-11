using System.Threading.Tasks;

namespace AccountingInventory.Core.Interfaces
{
    public interface IActivityLogService
    {
        Task LogActivityAsync(string action, string entityName, string entityId, string description, object? rawData = null);
    }
}
