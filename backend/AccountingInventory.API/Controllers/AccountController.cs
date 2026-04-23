using AccountingInventory.Core.DTOs;
using AccountingInventory.Core.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace AccountingInventory.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly IConfiguration _configuration;

        public AccountController(UserManager<AppUser> userManager, IConfiguration configuration)
        {
            _userManager = userManager;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public async Task<ActionResult<UserDto>> Login(LoginDto loginDto)
        {
            var user = await _userManager.FindByNameAsync(loginDto.Username);

            if (user == null || user.IsDisabled || !await _userManager.CheckPasswordAsync(user, loginDto.Password))
                return Unauthorized("Invalid credentials or account disabled.");

            var roles = await _userManager.GetRolesAsync(user);
            var token = CreateToken(user, roles);
            var refreshToken = GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.Now.AddDays(7);
            await _userManager.UpdateAsync(user);

            return new UserDto
            {
                Id = user.Id,
                Username = user.UserName!,
                FullName = user.FullName ?? "",
                Role = roles.FirstOrDefault() ?? "User",
                Token = token,
                RefreshToken = refreshToken
            };
        }

        [HttpPost("refresh-token")]
        public async Task<ActionResult<UserDto>> RefreshToken(TokenRequestDto tokenRequest)
        {
            var principal = GetPrincipalFromExpiredToken(tokenRequest.Token);
            if (principal == null) return BadRequest("Invalid token");

            var username = principal.FindFirstValue(ClaimTypes.Name);
            var user = await _userManager.FindByNameAsync(username!);

            if (user == null || user.RefreshToken != tokenRequest.RefreshToken || user.RefreshTokenExpiryTime <= DateTime.Now)
                return BadRequest("Invalid refresh token");

            var roles = await _userManager.GetRolesAsync(user);
            var newToken = CreateToken(user, roles);
            var newRefreshToken = GenerateRefreshToken();

            user.RefreshToken = newRefreshToken;
            await _userManager.UpdateAsync(user);

            return new UserDto
            {
                Id = user.Id,
                Username = user.UserName!,
                FullName = user.FullName ?? "",
                Role = roles.FirstOrDefault() ?? "User",
                Token = newToken,
                RefreshToken = newRefreshToken
            };
        }

        [Authorize]
        [HttpPost("change-password")]
        public async Task<ActionResult> ChangePassword(ChangePasswordDto dto)
        {
            var username = User.FindFirstValue(ClaimTypes.Name);
            if (string.IsNullOrEmpty(username)) return Unauthorized();

            var user = await _userManager.FindByNameAsync(username);
            if (user == null) return NotFound();

            var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
            if (!result.Succeeded) return BadRequest(result.Errors);

            return NoContent();
        }

        private string CreateToken(AppUser user, IList<string> roles)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.UserName!),
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim("FullName", user.FullName ?? "")
            };

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.Now.AddMinutes(double.Parse(_configuration["Jwt:DurationInMinutes"] ?? "60")),
                SigningCredentials = creds,
                Issuer = _configuration["Jwt:Issuer"],
                Audience = _configuration["Jwt:Audience"]
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }

        private string GenerateRefreshToken()
        {
            var randomNumber = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }

        private ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
        {
            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!)),
                ValidateIssuer = true,
                ValidIssuer = _configuration["Jwt:Issuer"],
                ValidateAudience = true,
                ValidAudience = _configuration["Jwt:Audience"],
                ValidateLifetime = false // Here we are saying that we don't care about the token's expiration date
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out SecurityToken securityToken);
            if (!(securityToken is JwtSecurityToken jwtSecurityToken) || !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha512, StringComparison.InvariantCultureIgnoreCase))
                throw new SecurityTokenException("Invalid token");

            return principal;
        }
    }
}
