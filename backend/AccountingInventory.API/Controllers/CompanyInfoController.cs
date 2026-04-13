using AccountingInventory.Core.DTOs;
using AccountingInventory.Core.Entities;
using AccountingInventory.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AccountingInventory.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CompanyInfoController : ControllerBase
    {
        private readonly IGenericRepository<CompanyInfo> _repository;

        public CompanyInfoController(IGenericRepository<CompanyInfo> repository)
        {
            _repository = repository;
        }

        [HttpGet]
        public async Task<ActionResult<CompanyInfo>> GetCompanyInfo()
        {
            var infos = await _repository.GetAllAsync();
            var info = infos.FirstOrDefault();

            if (info == null)
            {
                // Initialize with a default empty record if none exists
                info = new CompanyInfo
                {
                    Name = "Your Company Name",
                    Currency = "BDT",
                    CurrencySymbol = "৳"
                };
                await _repository.AddAsync(info);
            }

            return Ok(info);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateCompanyInfo(CompanyInfoDto dto)
        {
            var infos = await _repository.GetAllAsync();
            var info = infos.FirstOrDefault();

            if (info == null)
            {
                info = new CompanyInfo();
                await _repository.AddAsync(info);
            }

            info.Name = dto.Name;
            info.Tagline = dto.Tagline ?? string.Empty;
            info.Logo = dto.Logo;
            info.Address = dto.Address ?? string.Empty;
            info.Mobile = dto.Mobile ?? string.Empty;
            info.Website = dto.Website ?? string.Empty;
            info.Email = dto.Email ?? string.Empty;
            info.TaxId = dto.TaxId ?? string.Empty;
            info.RegistrationNumber = dto.RegistrationNumber ?? string.Empty;
            info.Currency = dto.Currency;
            info.CurrencySymbol = dto.CurrencySymbol;

            await _repository.UpdateAsync(info);
            return NoContent();
        }
    }
}
