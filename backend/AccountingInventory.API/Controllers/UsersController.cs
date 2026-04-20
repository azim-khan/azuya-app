using AccountingInventory.Core.DTOs;
using AccountingInventory.Core.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AccountingInventory.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Policy = "SuperAdminOnly")]
    public class UsersController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;

        public UsersController(UserManager<AppUser> userManager, RoleManager<IdentityRole> roleManager)
        {
            _userManager = userManager;
            _roleManager = roleManager;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
        {
            var users = await _userManager.Users.ToListAsync();
            var userDtos = new List<UserDto>();

            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                userDtos.Add(new UserDto
                {
                    Id = user.Id,
                    Email = user.Email!,
                    FullName = user.FullName ?? "",
                    Role = roles.FirstOrDefault() ?? "User",
                    IsDisabled = user.IsDisabled
                });
            }

            return Ok(userDtos);
        }

        [HttpPost]
        public async Task<ActionResult<UserDto>> CreateUser(RegisterDto registerDto)
        {
            if (await _userManager.FindByEmailAsync(registerDto.Email) != null)
                return BadRequest("Email already exists");

            var user = new AppUser
            {
                UserName = registerDto.Email,
                Email = registerDto.Email,
                FullName = registerDto.FullName,
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(user, registerDto.Password);

            if (!result.Succeeded) return BadRequest(result.Errors);

            // Check if role exists, if not default to User
            var role = await _roleManager.RoleExistsAsync(registerDto.Role) ? registerDto.Role : "User";
            await _userManager.AddToRoleAsync(user, role);

            return Ok(new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                Role = role
            });
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateUser(string id, RegisterDto updateDto)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            user.FullName = updateDto.FullName;
            user.Email = updateDto.Email;
            user.UserName = updateDto.Email;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded) return BadRequest(result.Errors);

            // Update Role
            var currentRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
            await _userManager.AddToRoleAsync(user, updateDto.Role);

            return NoContent();
        }

        [HttpPost("{id}/toggle-status")]
        public async Task<ActionResult> ToggleStatus(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            user.IsDisabled = !user.IsDisabled;
            await _userManager.UpdateAsync(user);

            return Ok(new { IsDisabled = user.IsDisabled });
        }

        [HttpPost("{id}/reset-password")]
        public async Task<ActionResult> ResetPassword(string id, [FromBody] string newPassword)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, token, newPassword);

            if (!result.Succeeded) return BadRequest(result.Errors);

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded) return BadRequest(result.Errors);

            return NoContent();
        }
    }
}
