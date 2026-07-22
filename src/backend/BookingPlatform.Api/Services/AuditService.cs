using System;
using System.Threading.Tasks;
using BookingPlatform.Api.Data;
using BookingPlatform.Api.Models;

namespace BookingPlatform.Api.Services
{
    public interface IAuditService
    {
        Task LogAsync(Guid companyId, string entity, string entityId, string action, Guid? userId, string details);
    }

    public class AuditService : IAuditService
    {
        private readonly ApplicationDbContext _db;

        public AuditService(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task LogAsync(Guid companyId, string entity, string entityId, string action, Guid? userId, string details)
        {
            _db.AuditLogs.Add(new AuditLog
            {
                CompanyId = companyId,
                Entity = entity,
                EntityId = entityId,
                Action = action,
                UserId = userId,
                Details = details,
                TimestampUtc = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();
        }
    }
}
