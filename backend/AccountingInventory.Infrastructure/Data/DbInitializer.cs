using AccountingInventory.Core.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace AccountingInventory.Infrastructure.Data
{
    public static class DbInitializer
    {
        public static async Task Initialize(ApplicationDbContext context, UserManager<AppUser> userManager, RoleManager<IdentityRole> roleManager, IConfiguration configuration)
        {
            // Create Roles if they don't exist
            string[] roleNames = { "SuperAdmin", "Admin", "User" };
            foreach (var roleName in roleNames)
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    await roleManager.CreateAsync(new IdentityRole(roleName));
                }
            }

            // Check if any user exists
            if (!await userManager.Users.AnyAsync())
            {
                var adminSettings = configuration.GetSection("SuperAdmin");
                var username = adminSettings["Username"] ?? "admin";
                var password = adminSettings["Password"] ?? "AdminPassword123!";
                var fullName = adminSettings["FullName"] ?? "Super Admin";

                var user = new AppUser
                {
                    UserName = username,
                    FullName = fullName,
                    EmailConfirmed = true
                };

                var result = await userManager.CreateAsync(user, password);
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(user, "SuperAdmin");
                }
            }

            // Seed System Accounts
            if (!await context.Accounts.AnyAsync())
            {
                var systemAccounts = new List<Account>
                {
                    new Account { Name = "Cash", Type = AccountType.Asset, IsSystemAccount = true, Balance = 0 },
                    new Account { Name = "Bank", Type = AccountType.Asset, IsSystemAccount = true, Balance = 0 },
                    new Account { Name = "Sales", Type = AccountType.Income, IsSystemAccount = true, Balance = 0 },
                    new Account { Name = "Purchases", Type = AccountType.Expense, IsSystemAccount = true, Balance = 0 },
                    new Account { Name = "Inventory", Type = AccountType.Asset, IsSystemAccount = true, Balance = 0 },
                    new Account { Name = "Expense", Type = AccountType.Expense, IsSystemAccount = true, Balance = 0 },
                    new Account { Name = "Accounts Receivable", Type = AccountType.Asset, IsSystemAccount = true, Balance = 0 },
                    new Account { Name = "Accounts Payable", Type = AccountType.Liability, IsSystemAccount = true, Balance = 0 },
                };

                context.Accounts.AddRange(systemAccounts);
                await context.SaveChangesAsync();
            }
        }
    }
}
