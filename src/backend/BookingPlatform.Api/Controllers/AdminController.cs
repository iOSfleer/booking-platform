using System;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using BookingPlatform.Api.Data;
using BookingPlatform.Api.Dtos;
using BookingPlatform.Api.Models;
using BookingPlatform.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookingPlatform.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/admin")]
    public class AdminController : ControllerBase
    {
        private const int SlotMinutes = 30;
        private readonly ApplicationDbContext _db;
        private readonly IAuditService _auditService;
        private readonly IBookingService _bookingService;

        public AdminController(ApplicationDbContext db, IAuditService auditService, IBookingService bookingService)
        {
            _db = db;
            _auditService = auditService;
            _bookingService = bookingService;
        }

        [HttpGet("employees")]
        public async Task<IActionResult> GetEmployees()
        {
            var companyId = GetCompanyId();
            var employees = await _db.Employees
                .Where(e => e.CompanyId == companyId && e.IsActive)
                .OrderBy(e => e.Name)
                .Select(e => new { e.Id, e.Name, e.RoleName })
                .ToListAsync();

            return Ok(employees);
        }

        [HttpGet("appointments")]
        public async Task<IActionResult> GetAppointments(
            [FromQuery] DateTime? fromUtc,
            [FromQuery] DateTime? toUtc,
            [FromQuery] Guid? employeeId,
            [FromQuery] string search,
            [FromQuery] string sortBy = "startTime",
            [FromQuery] string sortDir = "asc",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            fromUtc = fromUtc.HasValue ? EnsureUtc(fromUtc.Value) : (DateTime?)null;
            toUtc = toUtc.HasValue ? EnsureUtc(toUtc.Value) : (DateTime?)null;
            var companyId = GetCompanyId();
            page = page < 1 ? 1 : page;
            pageSize = pageSize < 1 ? 20 : (pageSize > 100 ? 100 : pageSize);
            employeeId = GetEffectiveEmployeeFilter(employeeId);

            var query = BuildAppointmentQuery(companyId, fromUtc, toUtc, employeeId, search);
            query = ApplyAppointmentSorting(query, sortBy, sortDir);

            var total = await query.CountAsync();
            var appointments = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new
                {
                    a.Id,
                    a.StartTimeUtc,
                    a.EndTimeUtc,
                    Status = a.Status.ToString(),
                    Service = a.Service.Name,
                    Customer = a.Customer.Name,
                    a.EmployeeId,
                    EmployeeName = a.Employee != null ? a.Employee.Name : null
                })
                .ToListAsync();

            return Ok(new { page, pageSize, total, items = appointments });
        }

        [HttpPost("appointments")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> CreateAppointment([FromBody] CreateBookingRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var companyId = GetCompanyId();

            try
            {
                var result = await _bookingService.CreateBooking(companyId, request);
                await _auditService.LogAsync(companyId, "Appointment", result.AppointmentId.ToString(), "CreateByAdmin", GetCurrentUserId(), "Appointment created from admin calendar.");
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("appointments/export-csv")]
        public async Task<IActionResult> ExportAppointmentsCsv(
            [FromQuery] DateTime? fromUtc,
            [FromQuery] DateTime? toUtc,
            [FromQuery] Guid? employeeId,
            [FromQuery] string search,
            [FromQuery] string sortBy = "startTime",
            [FromQuery] string sortDir = "asc")
        {
            fromUtc = fromUtc.HasValue ? EnsureUtc(fromUtc.Value) : (DateTime?)null;
            toUtc = toUtc.HasValue ? EnsureUtc(toUtc.Value) : (DateTime?)null;
            var companyId = GetCompanyId();
            employeeId = GetEffectiveEmployeeFilter(employeeId);
            var query = BuildAppointmentQuery(companyId, fromUtc, toUtc, employeeId, search);
            query = ApplyAppointmentSorting(query, sortBy, sortDir);

            var appointments = await query
                .Select(a => new
                {
                    a.StartTimeUtc,
                    a.EndTimeUtc,
                    Status = a.Status.ToString(),
                    Service = a.Service.Name,
                    Customer = a.Customer.Name,
                    EmployeeName = a.Employee != null ? a.Employee.Name : ""
                })
                .ToListAsync();

            var sb = new StringBuilder();
            sb.AppendLine("StartTimeUtc,EndTimeUtc,Status,Service,Customer,Employee");

            foreach (var item in appointments)
            {
                sb.AppendLine(string.Join(",",
                    EscapeCsv(item.StartTimeUtc.ToString("O")),
                    EscapeCsv(item.EndTimeUtc.ToString("O")),
                    EscapeCsv(item.Status),
                    EscapeCsv(item.Service),
                    EscapeCsv(item.Customer),
                    EscapeCsv(item.EmployeeName)
                ));
            }

            var bytes = Encoding.UTF8.GetBytes(sb.ToString());
            return File(bytes, "text/csv", "appointments.csv");
        }

        [HttpPatch("appointments/{id}/assign-employee")]
        public async Task<IActionResult> AssignEmployee(Guid id, [FromBody] AssignEmployeeRequest request)
        {
            if (!IsAdministrator())
            {
                return Forbid();
            }

            var companyId = GetCompanyId();
            var appointment = await _db.Appointments
                .FirstOrDefaultAsync(a => a.CompanyId == companyId && a.Id == id);

            if (appointment == null)
            {
                return NotFound();
            }

            if (request.EmployeeId.HasValue)
            {
                var employee = await _db.Employees.FirstOrDefaultAsync(e => e.CompanyId == companyId && e.Id == request.EmployeeId.Value && e.IsActive);
                if (employee == null)
                {
                    return BadRequest(new { message = "Mitarbeiter nicht gefunden." });
                }

                var blockedByException = await IsBlockedByException(companyId, request.EmployeeId, appointment.StartTimeUtc, appointment.EndTimeUtc);
                if (blockedByException)
                {
                    return BadRequest(new { message = "Mitarbeiter ist in diesem Zeitraum nicht verfügbar." });
                }

                var hasConflict = await _db.Appointments.AnyAsync(a =>
                    a.CompanyId == companyId
                    && a.Id != appointment.Id
                    && a.Status != AppointmentStatus.Cancelled
                    && a.EmployeeId == request.EmployeeId.Value
                    && a.StartTimeUtc < appointment.EndTimeUtc
                    && a.EndTimeUtc > appointment.StartTimeUtc);

                if (hasConflict)
                {
                    return BadRequest(new { message = "Mitarbeiter hat bereits einen Termin in diesem Zeitraum." });
                }
            }

            appointment.EmployeeId = request.EmployeeId;
            await _db.SaveChangesAsync();
            await _auditService.LogAsync(companyId, "Appointment", appointment.Id.ToString(), "AssignEmployee", GetCurrentUserId(), $"Employee set to {appointment.EmployeeId}");

            return Ok(new { appointment.Id, appointment.EmployeeId });
        }

        [HttpPatch("appointments/{id}/cancel")]
        public async Task<IActionResult> CancelAppointment(Guid id)
        {
            var companyId = GetCompanyId();
            var appointment = await _db.Appointments
                .FirstOrDefaultAsync(a => a.CompanyId == companyId && a.Id == id);

            if (appointment == null)
            {
                return NotFound();
            }

            if (!CanManageAppointment(appointment))
            {
                return Forbid();
            }

            if (appointment.StartTimeUtc < DateTime.UtcNow.AddHours(24))
            {
                return BadRequest(new { message = "Storno ist nur bis 24h vor Terminbeginn erlaubt." });
            }

            appointment.Status = AppointmentStatus.Cancelled;
            await _db.SaveChangesAsync();
            await _auditService.LogAsync(companyId, "Appointment", appointment.Id.ToString(), "Cancel", GetCurrentUserId(), "Appointment cancelled by admin/employee.");

            return Ok(new { appointment.Id, Status = appointment.Status.ToString() });
        }

        [HttpPatch("appointments/{id}/reschedule")]
        public async Task<IActionResult> RescheduleAppointment(Guid id, [FromBody] RescheduleAppointmentRequest request)
        {
            var newStartTimeUtc = EnsureUtc(request.NewStartTimeUtc);
            var companyId = GetCompanyId();
            var appointment = await _db.Appointments
                .Include(a => a.Service)
                .FirstOrDefaultAsync(a => a.CompanyId == companyId && a.Id == id);

            if (appointment == null)
            {
                return NotFound();
            }

            if (!CanManageAppointment(appointment))
            {
                return Forbid();
            }

            if (appointment.StartTimeUtc < DateTime.UtcNow.AddHours(24))
            {
                return BadRequest(new { message = "Umbuchung ist nur bis 24h vor Terminbeginn erlaubt." });
            }

            if (newStartTimeUtc < DateTime.UtcNow.AddHours(24))
            {
                return BadRequest(new { message = "Neue Terminzeit muss mindestens 24h in der Zukunft liegen." });
            }

            if (newStartTimeUtc.Minute % SlotMinutes != 0 || newStartTimeUtc.Second != 0)
            {
                return BadRequest(new { message = "Startzeit muss auf 30-Minuten-Slot liegen." });
            }

            var newEndTime = newStartTimeUtc.AddMinutes(appointment.Service.DurationMinutes);
            var fitsHours = await IsInsideBusinessHours(companyId, newStartTimeUtc, newEndTime);
            if (!fitsHours)
            {
                return BadRequest(new { message = "Neue Terminzeit liegt außerhalb der Öffnungszeiten." });
            }

            var blockedByException = await IsBlockedByException(companyId, appointment.EmployeeId, newStartTimeUtc, newEndTime);
            if (blockedByException)
            {
                return BadRequest(new { message = "Neue Terminzeit ist durch eine Ausnahme blockiert." });
            }

            var hasConflict = await _db.Appointments.AnyAsync(a =>
                a.CompanyId == companyId
                && a.Id != appointment.Id
                && a.Status != AppointmentStatus.Cancelled
                && a.StartTimeUtc < newEndTime
                && a.EndTimeUtc > newStartTimeUtc
                && (!appointment.EmployeeId.HasValue || a.EmployeeId == appointment.EmployeeId));

            if (hasConflict)
            {
                return BadRequest(new { message = "Neue Terminzeit ist nicht verfügbar." });
            }

            appointment.StartTimeUtc = newStartTimeUtc;
            appointment.EndTimeUtc = newEndTime;
            appointment.Status = AppointmentStatus.Rescheduled;
            await _db.SaveChangesAsync();
            await _auditService.LogAsync(companyId, "Appointment", appointment.Id.ToString(), "Reschedule", GetCurrentUserId(), $"Rescheduled to {appointment.StartTimeUtc:O}");

            return Ok(new
            {
                appointment.Id,
                appointment.StartTimeUtc,
                appointment.EndTimeUtc,
                Status = appointment.Status.ToString()
            });
        }

        [HttpGet("services")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> GetServices()
        {
            var companyId = GetCompanyId();
            var services = await _db.Services
                .Where(s => s.CompanyId == companyId)
                .OrderBy(s => s.Name)
                .ToListAsync();

            return Ok(services);
        }

        [HttpPost("services")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> CreateService([FromBody] UpsertServiceRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var companyId = GetCompanyId();
            var service = new Service
            {
                CompanyId = companyId,
                Name = request.Name,
                Description = request.Description,
                DurationMinutes = request.DurationMinutes,
                Price = request.Price,
                IsActive = request.IsActive
            };

            _db.Services.Add(service);
            await _db.SaveChangesAsync();
            await _auditService.LogAsync(companyId, "Service", service.Id.ToString(), "Create", GetCurrentUserId(), $"Service {service.Name} created.");
            return Ok(service);
        }

        [HttpPut("services/{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> UpdateService(Guid id, [FromBody] UpsertServiceRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var companyId = GetCompanyId();
            var service = await _db.Services.FirstOrDefaultAsync(s => s.CompanyId == companyId && s.Id == id);
            if (service == null)
            {
                return NotFound();
            }

            service.Name = request.Name;
            service.Description = request.Description;
            service.DurationMinutes = request.DurationMinutes;
            service.Price = request.Price;
            service.IsActive = request.IsActive;

            await _db.SaveChangesAsync();
            await _auditService.LogAsync(companyId, "Service", service.Id.ToString(), "Update", GetCurrentUserId(), $"Service {service.Name} updated.");
            return Ok(service);
        }

        [HttpDelete("services/{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> DeleteService(Guid id)
        {
            var companyId = GetCompanyId();
            var service = await _db.Services.FirstOrDefaultAsync(s => s.CompanyId == companyId && s.Id == id);
            if (service == null)
            {
                return NotFound();
            }

            service.IsActive = false;
            await _db.SaveChangesAsync();
            await _auditService.LogAsync(companyId, "Service", service.Id.ToString(), "Deactivate", GetCurrentUserId(), $"Service {service.Name} deactivated.");
            return NoContent();
        }

        [HttpGet("business-hours")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> GetBusinessHours()
        {
            var companyId = GetCompanyId();
            var items = await _db.BusinessHours
                .Where(b => b.CompanyId == companyId)
                .OrderBy(b => b.DayOfWeek)
                .ThenBy(b => b.From)
                .ToListAsync();

            return Ok(items);
        }

        [HttpPost("business-hours")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> CreateBusinessHour([FromBody] UpsertBusinessHourRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (request.From >= request.To)
            {
                return BadRequest(new { message = "Von muss vor Bis liegen." });
            }

            var companyId = GetCompanyId();
            var item = new BusinessHour
            {
                CompanyId = companyId,
                DayOfWeek = (DayOfWeek)request.DayOfWeek,
                From = request.From,
                To = request.To,
                IsActive = request.IsActive
            };

            _db.BusinessHours.Add(item);
            await _db.SaveChangesAsync();
            await _auditService.LogAsync(companyId, "BusinessHour", item.Id.ToString(), "Create", GetCurrentUserId(), $"Business hour created for {item.DayOfWeek}: {item.From}-{item.To}");
            return Ok(item);
        }

        [HttpPut("business-hours/{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> UpdateBusinessHour(Guid id, [FromBody] UpsertBusinessHourRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (request.From >= request.To)
            {
                return BadRequest(new { message = "Von muss vor Bis liegen." });
            }

            var companyId = GetCompanyId();
            var item = await _db.BusinessHours.FirstOrDefaultAsync(b => b.CompanyId == companyId && b.Id == id);
            if (item == null)
            {
                return NotFound();
            }

            item.DayOfWeek = (DayOfWeek)request.DayOfWeek;
            item.From = request.From;
            item.To = request.To;
            item.IsActive = request.IsActive;

            await _db.SaveChangesAsync();
            await _auditService.LogAsync(companyId, "BusinessHour", item.Id.ToString(), "Update", GetCurrentUserId(), $"Business hour updated for {item.DayOfWeek}: {item.From}-{item.To}");
            return Ok(item);
        }

        [HttpDelete("business-hours/{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> DeleteBusinessHour(Guid id)
        {
            var companyId = GetCompanyId();
            var item = await _db.BusinessHours.FirstOrDefaultAsync(b => b.CompanyId == companyId && b.Id == id);
            if (item == null)
            {
                return NotFound();
            }

            _db.BusinessHours.Remove(item);
            await _db.SaveChangesAsync();
            await _auditService.LogAsync(companyId, "BusinessHour", item.Id.ToString(), "Delete", GetCurrentUserId(), "Business hour removed.");
            return NoContent();
        }

        [HttpGet("exceptions")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> GetExceptions([FromQuery] Guid? employeeId)
        {
            var companyId = GetCompanyId();
            var query = _db.ExceptionPeriods
                .Where(x => x.CompanyId == companyId);

            if (employeeId.HasValue)
            {
                query = query.Where(x => x.EmployeeId == employeeId.Value);
            }

            var items = await query
                .OrderBy(x => x.Date)
                .ThenBy(x => x.From)
                .ToListAsync();

            return Ok(items);
        }

        [HttpPost("exceptions")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> CreateException([FromBody] UpsertExceptionPeriodRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if ((request.From.HasValue && !request.To.HasValue) || (!request.From.HasValue && request.To.HasValue))
            {
                return BadRequest(new { message = "From und To müssen beide gesetzt oder beide leer sein." });
            }

            if (request.From.HasValue && request.To.HasValue && request.From >= request.To)
            {
                return BadRequest(new { message = "From muss vor To liegen." });
            }

            var companyId = GetCompanyId();

            if (request.EmployeeId.HasValue)
            {
                var employeeExists = await _db.Employees.AnyAsync(e => e.CompanyId == companyId && e.Id == request.EmployeeId.Value && e.IsActive);
                if (!employeeExists)
                {
                    return BadRequest(new { message = "Mitarbeiter nicht gefunden." });
                }
            }

            var item = new ExceptionPeriod
            {
                CompanyId = companyId,
                EmployeeId = request.EmployeeId,
                Date = request.Date.Date,
                From = request.From,
                To = request.To,
                Type = request.Type,
                Description = request.Description
            };

            _db.ExceptionPeriods.Add(item);
            await _db.SaveChangesAsync();
            await _auditService.LogAsync(companyId, "ExceptionPeriod", item.Id.ToString(), "Create", GetCurrentUserId(), $"Exception created: {item.Type} on {item.Date:yyyy-MM-dd}");
            return Ok(item);
        }

        [HttpPut("exceptions/{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> UpdateException(Guid id, [FromBody] UpsertExceptionPeriodRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if ((request.From.HasValue && !request.To.HasValue) || (!request.From.HasValue && request.To.HasValue))
            {
                return BadRequest(new { message = "From und To müssen beide gesetzt oder beide leer sein." });
            }

            if (request.From.HasValue && request.To.HasValue && request.From >= request.To)
            {
                return BadRequest(new { message = "From muss vor To liegen." });
            }

            var companyId = GetCompanyId();
            if (request.EmployeeId.HasValue)
            {
                var employeeExists = await _db.Employees.AnyAsync(e => e.CompanyId == companyId && e.Id == request.EmployeeId.Value && e.IsActive);
                if (!employeeExists)
                {
                    return BadRequest(new { message = "Mitarbeiter nicht gefunden." });
                }
            }

            var item = await _db.ExceptionPeriods.FirstOrDefaultAsync(x => x.CompanyId == companyId && x.Id == id);
            if (item == null)
            {
                return NotFound();
            }

            item.EmployeeId = request.EmployeeId;
            item.Date = request.Date.Date;
            item.From = request.From;
            item.To = request.To;
            item.Type = request.Type;
            item.Description = request.Description;

            await _db.SaveChangesAsync();
            await _auditService.LogAsync(companyId, "ExceptionPeriod", item.Id.ToString(), "Update", GetCurrentUserId(), $"Exception updated: {item.Type} on {item.Date:yyyy-MM-dd}");
            return Ok(item);
        }

        [HttpDelete("exceptions/{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> DeleteException(Guid id)
        {
            var companyId = GetCompanyId();
            var item = await _db.ExceptionPeriods.FirstOrDefaultAsync(x => x.CompanyId == companyId && x.Id == id);
            if (item == null)
            {
                return NotFound();
            }

            _db.ExceptionPeriods.Remove(item);
            await _db.SaveChangesAsync();
            await _auditService.LogAsync(companyId, "ExceptionPeriod", item.Id.ToString(), "Delete", GetCurrentUserId(), "Exception removed.");
            return NoContent();
        }

        [HttpGet("audit-logs")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> GetAuditLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            var companyId = GetCompanyId();
            page = page < 1 ? 1 : page;
            pageSize = pageSize < 1 ? 50 : (pageSize > 200 ? 200 : pageSize);

            var query = _db.AuditLogs
                .Where(x => x.CompanyId == companyId)
                .OrderByDescending(x => x.TimestampUtc);

            var total = await query.CountAsync();
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new { page, pageSize, total, items });
        }

        [HttpGet("notifications")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> GetNotifications([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            var companyId = GetCompanyId();
            page = page < 1 ? 1 : page;
            pageSize = pageSize < 1 ? 50 : (pageSize > 200 ? 200 : pageSize);

            var query = _db.Notifications
                .Where(x => x.CompanyId == companyId)
                .OrderByDescending(x => x.SentAtUtc);

            var total = await query.CountAsync();
            var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
            return Ok(new { page, pageSize, total, items });
        }

        private IQueryable<Appointment> BuildAppointmentQuery(Guid companyId, DateTime? fromUtc, DateTime? toUtc, Guid? employeeId, string search)
        {
            var query = _db.Appointments
                .Include(a => a.Service)
                .Include(a => a.Customer)
                .Include(a => a.Employee)
                .Where(a => a.CompanyId == companyId);

            if (fromUtc.HasValue)
            {
                query = query.Where(a => a.StartTimeUtc >= fromUtc.Value);
            }

            if (toUtc.HasValue)
            {
                query = query.Where(a => a.StartTimeUtc <= toUtc.Value);
            }

            if (employeeId.HasValue)
            {
                query = query.Where(a => a.EmployeeId == employeeId.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(a =>
                    EF.Functions.ILike(a.Customer.Name, $"%{term}%")
                    || EF.Functions.ILike(a.Service.Name, $"%{term}%"));
            }

            return query;
        }

        private IQueryable<Appointment> ApplyAppointmentSorting(IQueryable<Appointment> query, string sortBy, string sortDir)
        {
            var desc = string.Equals(sortDir, "desc", StringComparison.OrdinalIgnoreCase);
            var key = (sortBy ?? "startTime").Trim().ToLowerInvariant();

            if (key == "customer")
            {
                return desc ? query.OrderByDescending(a => a.Customer.Name).ThenByDescending(a => a.StartTimeUtc) : query.OrderBy(a => a.Customer.Name).ThenBy(a => a.StartTimeUtc);
            }

            if (key == "service")
            {
                return desc ? query.OrderByDescending(a => a.Service.Name).ThenByDescending(a => a.StartTimeUtc) : query.OrderBy(a => a.Service.Name).ThenBy(a => a.StartTimeUtc);
            }

            if (key == "status")
            {
                return desc ? query.OrderByDescending(a => a.Status).ThenByDescending(a => a.StartTimeUtc) : query.OrderBy(a => a.Status).ThenBy(a => a.StartTimeUtc);
            }

            return desc ? query.OrderByDescending(a => a.StartTimeUtc) : query.OrderBy(a => a.StartTimeUtc);
        }

        private static string EscapeCsv(string value)
        {
            if (value == null)
            {
                return "";
            }

            var escaped = value.Replace("\"", "\"\"");
            return $"\"{escaped}\"";
        }

        private static DateTime EnsureUtc(DateTime value)
        {
            return value.Kind switch
            {
                DateTimeKind.Utc => value,
                DateTimeKind.Local => value.ToUniversalTime(),
                _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
            };
        }

        private Guid GetCompanyId()
        {
            return Guid.Parse(User.Claims.First(c => c.Type == "companyId").Value);
        }

        private Guid? GetCurrentUserId()
        {
            var sub = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier || c.Type == "sub")?.Value;
            return Guid.TryParse(sub, out var userId) ? userId : (Guid?)null;
        }

        private Guid? GetCurrentEmployeeId()
        {
            var employee = User.Claims.FirstOrDefault(c => c.Type == "employeeId")?.Value;
            return Guid.TryParse(employee, out var employeeId) ? employeeId : (Guid?)null;
        }

        private bool IsAdministrator()
        {
            return User.Claims.Any(c => c.Type == ClaimTypes.Role && c.Value == UserRole.Administrator.ToString());
        }

        private Guid? GetEffectiveEmployeeFilter(Guid? requestedEmployeeId)
        {
            if (IsAdministrator())
            {
                return requestedEmployeeId;
            }

            var employeeId = GetCurrentEmployeeId();
            return employeeId ?? Guid.Empty;
        }

        private bool CanManageAppointment(Appointment appointment)
        {
            if (IsAdministrator())
            {
                return true;
            }

            var employeeId = GetCurrentEmployeeId();
            return employeeId.HasValue && appointment.EmployeeId == employeeId.Value;
        }

        private async Task<bool> IsInsideBusinessHours(Guid companyId, DateTime startUtc, DateTime endUtc)
        {
            var blocks = await _db.BusinessHours
                .Where(x => x.CompanyId == companyId && x.DayOfWeek == startUtc.DayOfWeek && x.IsActive)
                .ToListAsync();

            return blocks.Any(b => startUtc.TimeOfDay >= b.From && endUtc.TimeOfDay <= b.To);
        }

        private async Task<bool> IsBlockedByException(Guid companyId, Guid? employeeId, DateTime startUtc, DateTime endUtc)
        {
            var date = startUtc.Date;
            var exceptions = await _db.ExceptionPeriods
                .Where(x => x.CompanyId == companyId
                            && x.Date.Date == date
                            && (!x.EmployeeId.HasValue || x.EmployeeId == employeeId))
                .ToListAsync();

            return exceptions.Any(e =>
            {
                if (!e.From.HasValue || !e.To.HasValue)
                {
                    return true;
                }

                var exStart = date.Add(e.From.Value);
                var exEnd = date.Add(e.To.Value);
                return exStart < endUtc && exEnd > startUtc;
            });
        }
    }
}
