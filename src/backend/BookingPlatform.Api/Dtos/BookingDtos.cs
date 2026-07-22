using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace BookingPlatform.Api.Dtos
{
    public class ServiceDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public int DurationMinutes { get; set; }
        public decimal Price { get; set; }
    }

    public class AvailabilityResponse
    {
        public DateTime Date { get; set; }
        public List<DateTime> AvailableStartTimesUtc { get; set; }
    }

    public class CreateBookingRequest
    {
        [Required]
        public Guid ServiceId { get; set; }

        public Guid? EmployeeId { get; set; }

        [Required]
        public DateTime StartTimeUtc { get; set; }

        [Required]
        public string CustomerName { get; set; }

        [Required]
        [EmailAddress]
        public string CustomerEmail { get; set; }

        public string CustomerPhone { get; set; }
        public string Notes { get; set; }
    }

    public class BookingResultDto
    {
        public Guid AppointmentId { get; set; }
        public string Status { get; set; }
    }

    public class LoginRequest
    {
        [Required]
        public string Email { get; set; }

        [Required]
        public string Password { get; set; }

        [Required]
        public string Subdomain { get; set; }
    }

    public class LoginResponse
    {
        public string Token { get; set; }
        public DateTime ExpiresAtUtc { get; set; }
        public string Role { get; set; }
        public Guid CompanyId { get; set; }
    }
}
