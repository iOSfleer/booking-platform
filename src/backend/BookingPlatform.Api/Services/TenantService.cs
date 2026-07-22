using System;
using System.Linq;
using System.Threading.Tasks;
using BookingPlatform.Api.Data;
using BookingPlatform.Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace BookingPlatform.Api.Services
{
    public interface ITenantService
    {
        Task<Company> ResolveCompanyAsync(HttpRequest request);
    }

    public class TenantService : ITenantService
    {
        private readonly ApplicationDbContext _db;

        public TenantService(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<Company> ResolveCompanyAsync(HttpRequest request)
        {
            var explicitSubdomain = request.Headers["X-Tenant-Subdomain"].FirstOrDefault();
            var host = request.Host.Host;

            var subdomain = !string.IsNullOrWhiteSpace(explicitSubdomain)
                ? explicitSubdomain.Trim().ToLowerInvariant()
                : ExtractSubdomain(host);

            if (string.IsNullOrWhiteSpace(subdomain))
            {
                return null;
            }

            return await _db.Companies.FirstOrDefaultAsync(c => c.Subdomain == subdomain && c.IsActive);
        }

        private static string ExtractSubdomain(string host)
        {
            if (string.IsNullOrWhiteSpace(host))
            {
                return null;
            }

            var parts = host.Split('.');
            if (parts.Length < 3)
            {
                return null;
            }

            return parts[0].ToLowerInvariant();
        }
    }
}
