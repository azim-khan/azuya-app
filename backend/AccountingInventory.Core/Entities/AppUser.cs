using Microsoft.AspNetCore.Identity;

namespace AccountingInventory.Core.Entities
{
    public class AppUser : IdentityUser
    {
        public string? FullName { get; set; }
        public bool IsDisabled { get; set; }
        public string? RefreshToken { get; set; }
        public DateTime RefreshTokenExpiryTime { get; set; }
    }
}
