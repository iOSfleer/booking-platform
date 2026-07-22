using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BookingPlatform.Api.Data;
using BookingPlatform.Api.Dtos;
using BookingPlatform.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BookingPlatform.Api.Services
{
    public interface IBookingService
    {
        Task<List<DateTime>> GetAvailableSlots(Guid companyId, Guid serviceId, DateTime dateUtc, Guid? employeeId = null);
        Task<BookingResultDto> CreateBooking(Guid companyId, CreateBookingRequest request);
    }

    public class BookingService : IBookingService
    {
        private const int SlotMinutes = 30;
        private readonly ApplicationDbContext _db;
        private readonly INotificationService _notificationService;
        private readonly IAuditService _auditService;

        public BookingService(ApplicationDbContext db, INotificationService notificationService, IAuditService auditService)
        {
            _db = db;
            _notificationService = notificationService;
            _auditService = auditService;
        }

        public async Task<List<DateTime>> GetAvailableSlots(Guid companyId, Guid serviceId, DateTime dateUtc, Guid? employeeId = null)
        {
            var service = await _db.Services.FirstOrDefaultAsync(s => s.CompanyId == companyId && s.Id == serviceId && s.IsActive);
            if (service == null)
            {
                return new List<DateTime>();
            }

            var timeZone = GetCompanyTimeZone();
            var localDate = dateUtc.Date;
            var businessHours = await _db.BusinessHours
                .Where(x => x.CompanyId == companyId && x.DayOfWeek == localDate.DayOfWeek && x.IsActive)
                .ToListAsync();

            if (!businessHours.Any())
            {
                return new List<DateTime>();
            }

            var exceptions = await _db.ExceptionPeriods
                .Where(x => x.CompanyId == companyId
                            && x.Date.Date == localDate
                            && (!x.EmployeeId.HasValue || x.EmployeeId == employeeId))
                .ToListAsync();

            var available = new List<DateTime>();
            foreach (var block in businessHours)
            {
                var localStart = localDate.Add(block.From);
                var localEnd = localDate.Add(block.To);

                for (var localSlot = localStart; localSlot.AddMinutes(service.DurationMinutes) <= localEnd; localSlot = localSlot.AddMinutes(SlotMinutes))
                {
                    var slotUtc = ConvertLocalToUtc(localSlot, timeZone);
                    if (slotUtc < DateTime.UtcNow.AddHours(24))
                    {
                        continue;
                    }

                    var slotEndUtc = slotUtc.AddMinutes(service.DurationMinutes);

                    var hasBlockingAppointment = await _db.Appointments.AnyAsync(a =>
                        a.CompanyId == companyId
                        && a.Status != AppointmentStatus.Cancelled
                        && a.StartTimeUtc < slotEndUtc
                        && a.EndTimeUtc > slotUtc
                        && (!employeeId.HasValue || a.EmployeeId == employeeId));

                    if (hasBlockingAppointment)
                    {
                        continue;
                    }

                    if (!IsBlockedByException(exceptions, localDate, localSlot, localSlot.AddMinutes(service.DurationMinutes)))
                    {
                        available.Add(slotUtc);
                    }
                }
            }

            return available.OrderBy(x => x).ToList();
        }

        public async Task<BookingResultDto> CreateBooking(Guid companyId, CreateBookingRequest request)
        {
            var requestedStartUtc = EnsureUtc(request.StartTimeUtc);
            var company = await _db.Companies.FirstOrDefaultAsync(c => c.Id == companyId && c.IsActive);
            if (company == null)
            {
                throw new InvalidOperationException("Unternehmen nicht gefunden.");
            }

            var service = await _db.Services.FirstOrDefaultAsync(s => s.CompanyId == companyId && s.Id == request.ServiceId && s.IsActive);
            if (service == null)
            {
                throw new InvalidOperationException("Service nicht gefunden.");
            }

            if (requestedStartUtc < DateTime.UtcNow.AddHours(24))
            {
                throw new InvalidOperationException("Buchung muss mindestens 24h im Voraus erfolgen.");
            }

            if (requestedStartUtc.Minute % SlotMinutes != 0 || requestedStartUtc.Second != 0)
            {
                throw new InvalidOperationException("Startzeit muss auf 30-Minuten-Slot liegen.");
            }

            var timeZone = GetCompanyTimeZone();
            var localStart = TimeZoneInfo.ConvertTimeFromUtc(requestedStartUtc, timeZone);
            var localEnd = localStart.AddMinutes(service.DurationMinutes);
            var localDate = localStart.Date;
            var dayBlocks = await _db.BusinessHours.Where(x => x.CompanyId == companyId && x.DayOfWeek == localDate.DayOfWeek && x.IsActive).ToListAsync();

            var fitsBusinessHours = dayBlocks.Any(b => localStart.TimeOfDay >= b.From && localEnd.TimeOfDay <= b.To);
            if (!fitsBusinessHours)
            {
                throw new InvalidOperationException("Termin liegt außerhalb der Öffnungszeiten.");
            }

            var exceptions = await _db.ExceptionPeriods
                .Where(x => x.CompanyId == companyId
                            && x.Date.Date == localDate
                            && (!x.EmployeeId.HasValue || x.EmployeeId == request.EmployeeId))
                .ToListAsync();

            if (IsBlockedByException(exceptions, localDate, localStart, localEnd))
            {
                throw new InvalidOperationException("Der gewünschte Zeitraum ist durch eine Ausnahme blockiert.");
            }

            var hasConflict = await _db.Appointments.AnyAsync(a =>
                a.CompanyId == companyId
                && a.Status != AppointmentStatus.Cancelled
                && a.StartTimeUtc < requestedStartUtc.AddMinutes(service.DurationMinutes)
                && a.EndTimeUtc > requestedStartUtc
                && (!request.EmployeeId.HasValue || a.EmployeeId == request.EmployeeId));

            if (hasConflict)
            {
                throw new InvalidOperationException("Der gewünschte Zeitraum ist nicht verfügbar.");
            }

            var existingCustomer = await _db.Customers
                .FirstOrDefaultAsync(c => c.CompanyId == companyId && c.Email == request.CustomerEmail);

            var customer = existingCustomer ?? new Customer
            {
                CompanyId = companyId,
                Name = request.CustomerName,
                Email = request.CustomerEmail,
                Phone = request.CustomerPhone
            };

            if (existingCustomer == null)
            {
                _db.Customers.Add(customer);
            }

            var appointment = new Appointment
            {
                CompanyId = companyId,
                EmployeeId = request.EmployeeId,
                ServiceId = request.ServiceId,
                Customer = customer,
                StartTimeUtc = requestedStartUtc,
                EndTimeUtc = requestedStartUtc.AddMinutes(service.DurationMinutes),
                Notes = request.Notes,
                Status = AppointmentStatus.Confirmed,
                Source = "Web"
            };

            _db.Appointments.Add(appointment);
            await _db.SaveChangesAsync();

            await _notificationService.SendBookingConfirmationAsync(company, service, customer, appointment);
            await _auditService.LogAsync(companyId, "Appointment", appointment.Id.ToString(), "Create", null, "Public booking created and confirmed.");

            return new BookingResultDto
            {
                AppointmentId = appointment.Id,
                Status = appointment.Status.ToString()
            };
        }

        private static bool IsBlockedByException(List<ExceptionPeriod> exceptions, DateTime localDate, DateTime slotStartLocal, DateTime slotEndLocal)
        {
            return exceptions.Any(e =>
            {
                if (!e.From.HasValue || !e.To.HasValue)
                {
                    return true;
                }

                var exStart = localDate.Add(e.From.Value);
                var exEnd = localDate.Add(e.To.Value);
                return exStart < slotEndLocal && exEnd > slotStartLocal;
            });
        }

        private static TimeZoneInfo GetCompanyTimeZone()
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById("Europe/Berlin");
            }
            catch (TimeZoneNotFoundException)
            {
                return TimeZoneInfo.FindSystemTimeZoneById("W. Europe Standard Time");
            }
            catch (InvalidTimeZoneException)
            {
                return TimeZoneInfo.Utc;
            }
        }

        private static DateTime ConvertLocalToUtc(DateTime localDateTime, TimeZoneInfo timeZone)
        {
            var unspecified = DateTime.SpecifyKind(localDateTime, DateTimeKind.Unspecified);
            return TimeZoneInfo.ConvertTimeToUtc(unspecified, timeZone);
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
    }
}
