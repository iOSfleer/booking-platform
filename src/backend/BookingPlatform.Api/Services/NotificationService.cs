using System;
using System.Threading.Tasks;
using BookingPlatform.Api.Data;
using BookingPlatform.Api.Models;

namespace BookingPlatform.Api.Services
{
    public interface INotificationService
    {
        Task SendBookingConfirmationAsync(Company company, Service service, Customer customer, Appointment appointment);
    }

    public class NotificationService : INotificationService
    {
        private readonly ApplicationDbContext _db;
        private readonly IEmailService _emailService;

        public NotificationService(ApplicationDbContext db, IEmailService emailService)
        {
            _db = db;
            _emailService = emailService;
        }

        public async Task SendBookingConfirmationAsync(Company company, Service service, Customer customer, Appointment appointment)
        {
            await SendAndLog(company.Id, appointment.Id, customer.Email, "BookingCustomer", $"Terminbestätigung: {service.Name}",
                $"Hallo {customer.Name},\n\nIhr Termin für {service.Name} wurde bestätigt.\nZeit: {appointment.StartTimeUtc:u}\n\nVielen Dank.");

            if (!string.IsNullOrWhiteSpace(company.ContactEmail))
            {
                await SendAndLog(company.Id, appointment.Id, company.ContactEmail, "BookingCompany", $"Neue Buchung: {service.Name}",
                    $"Neue Buchung von {customer.Name} ({customer.Email}).\nLeistung: {service.Name}\nZeit: {appointment.StartTimeUtc:u}");
            }
        }

        private async Task SendAndLog(Guid companyId, Guid appointmentId, string recipient, string type, string subject, string body)
        {
            var log = new NotificationLog
            {
                CompanyId = companyId,
                AppointmentId = appointmentId,
                Recipient = recipient,
                Type = type,
                Status = "Pending",
                SentAtUtc = DateTime.UtcNow
            };

            try
            {
                await _emailService.SendAsync(recipient, subject, body);
                log.Status = "Sent";
            }
            catch (Exception ex)
            {
                log.Status = "Failed";
                log.Error = ex.Message;
            }

            _db.Notifications.Add(log);
            await _db.SaveChangesAsync();
        }
    }
}
