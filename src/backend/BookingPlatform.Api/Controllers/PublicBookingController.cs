using System;
using System.Linq;
using System.Threading.Tasks;
using BookingPlatform.Api.Data;
using BookingPlatform.Api.Dtos;
using BookingPlatform.Api.Models;
using BookingPlatform.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookingPlatform.Api.Controllers
{
    [ApiController]
    [Route("api/public")]
    public class PublicBookingController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly IBookingService _bookingService;
        private readonly ITenantService _tenantService;

        public PublicBookingController(ApplicationDbContext db, IBookingService bookingService, ITenantService tenantService)
        {
            _db = db;
            _bookingService = bookingService;
            _tenantService = tenantService;
        }

        [HttpGet("companies/{companyId}/services")]
        public async Task<IActionResult> GetServicesByCompanyId(Guid companyId)
        {
            return Ok(await GetServicesInternal(companyId));
        }

        [HttpGet("services")]
        public async Task<IActionResult> GetServicesByTenant()
        {
            var company = await ResolveTenantCompany();
            if (company == null)
            {
                return BadRequest(new { message = "Mandant nicht auflösbar. Bitte Subdomain oder X-Tenant-Subdomain setzen." });
            }

            return Ok(await GetServicesInternal(company.Id));
        }

        [HttpGet("companies/{companyId}/availability")]
        public async Task<IActionResult> GetAvailabilityByCompanyId(Guid companyId, [FromQuery] Guid serviceId, [FromQuery] DateTime date, [FromQuery] Guid? employeeId)
        {
            return Ok(await GetAvailabilityInternal(companyId, serviceId, date, employeeId));
        }

        [HttpGet("availability")]
        public async Task<IActionResult> GetAvailabilityByTenant([FromQuery] Guid serviceId, [FromQuery] DateTime date, [FromQuery] Guid? employeeId)
        {
            var company = await ResolveTenantCompany();
            if (company == null)
            {
                return BadRequest(new { message = "Mandant nicht auflösbar. Bitte Subdomain oder X-Tenant-Subdomain setzen." });
            }

            return Ok(await GetAvailabilityInternal(company.Id, serviceId, date, employeeId));
        }

        [HttpPost("companies/{companyId}/bookings")]
        public async Task<IActionResult> CreateBookingByCompanyId(Guid companyId, [FromBody] CreateBookingRequest request)
        {
            return await CreateBookingInternal(companyId, request);
        }

        [HttpPost("bookings")]
        public async Task<IActionResult> CreateBookingByTenant([FromBody] CreateBookingRequest request)
        {
            var company = await ResolveTenantCompany();
            if (company == null)
            {
                return BadRequest(new { message = "Mandant nicht auflösbar. Bitte Subdomain oder X-Tenant-Subdomain setzen." });
            }

            return await CreateBookingInternal(company.Id, request);
        }

        private async Task<ServiceDto[]> GetServicesInternal(Guid companyId)
        {
            return await _db.Services
                .Where(x => x.CompanyId == companyId && x.IsActive)
                .Select(x => new ServiceDto
                {
                    Id = x.Id,
                    Name = x.Name,
                    Description = x.Description,
                    DurationMinutes = x.DurationMinutes,
                    Price = x.Price
                })
                .ToArrayAsync();
        }

        private async Task<AvailabilityResponse> GetAvailabilityInternal(Guid companyId, Guid serviceId, DateTime date, Guid? employeeId)
        {
            var slots = await _bookingService.GetAvailableSlots(companyId, serviceId, date, employeeId);
            return new AvailabilityResponse { Date = date.Date, AvailableStartTimesUtc = slots };
        }

        private async Task<IActionResult> CreateBookingInternal(Guid companyId, CreateBookingRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var result = await _bookingService.CreateBooking(companyId, request);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        private async Task<Company> ResolveTenantCompany()
        {
            return await _tenantService.ResolveCompanyAsync(Request);
        }
    }
}
