using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace BookingPlatform.Api.Services
{
    public interface IEmailService
    {
        Task SendAsync(string to, string subject, string body);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendAsync(string to, string subject, string body)
        {
            var host = _configuration["Email:SmtpHost"];
            var from = _configuration["Email:FromAddress"];

            if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(from))
            {
                return;
            }

            var port = int.TryParse(_configuration["Email:SmtpPort"], out var parsedPort) ? parsedPort : 587;
            var user = _configuration["Email:Username"];
            var pass = _configuration["Email:Password"];
            var enableSsl = bool.TryParse(_configuration["Email:EnableSsl"], out var ssl) ? ssl : true;

            using var client = new SmtpClient(host, port)
            {
                EnableSsl = enableSsl,
                Credentials = string.IsNullOrWhiteSpace(user)
                    ? CredentialCache.DefaultNetworkCredentials
                    : new NetworkCredential(user, pass)
            };

            using var message = new MailMessage(from, to, subject, body)
            {
                IsBodyHtml = false
            };

            await client.SendMailAsync(message);
        }
    }
}
