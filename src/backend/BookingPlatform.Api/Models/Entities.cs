using System;
using System.Collections.Generic;

namespace BookingPlatform.Api.Models
{
    public enum UserRole
    {
        Administrator = 1,
        Employee = 2
    }

    public enum AppointmentStatus
    {
        Requested = 1,
        Confirmed = 2,
        Rescheduled = 3,
        Cancelled = 4,
        Completed = 5,
        NoShow = 6
    }

    public class Company
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; }
        public string Domain { get; set; }
        public string Subdomain { get; set; }
        public string Logo { get; set; }
        public string ContactEmail { get; set; }
        public string ContactPhone { get; set; }
        public string PrimaryColor { get; set; }
        public bool IsActive { get; set; } = true;

        public ICollection<AppUser> Users { get; set; }
        public ICollection<Employee> Employees { get; set; }
        public ICollection<Service> Services { get; set; }
        public ICollection<Customer> Customers { get; set; }
        public ICollection<Appointment> Appointments { get; set; }
    }

    public class AppUser
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid CompanyId { get; set; }
        public Company Company { get; set; }
        public Guid? EmployeeId { get; set; }
        public Employee Employee { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string PasswordHash { get; set; }
        public string PasswordSalt { get; set; }
        public UserRole Role { get; set; }
    }

    public class Employee
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid CompanyId { get; set; }
        public Company Company { get; set; }
        public string Name { get; set; }
        public string RoleName { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class Service
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid CompanyId { get; set; }
        public Company Company { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public int DurationMinutes { get; set; }
        public decimal Price { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class Customer
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid CompanyId { get; set; }
        public Company Company { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
    }

    public class Appointment
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid CompanyId { get; set; }
        public Company Company { get; set; }
        public Guid? EmployeeId { get; set; }
        public Employee Employee { get; set; }
        public Guid ServiceId { get; set; }
        public Service Service { get; set; }
        public Guid CustomerId { get; set; }
        public Customer Customer { get; set; }
        public DateTime StartTimeUtc { get; set; }
        public DateTime EndTimeUtc { get; set; }
        public AppointmentStatus Status { get; set; } = AppointmentStatus.Confirmed;
        public string Notes { get; set; }
        public string Source { get; set; } = "Web";
        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    }

    public class BusinessHour
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid CompanyId { get; set; }
        public Company Company { get; set; }
        public DayOfWeek DayOfWeek { get; set; }
        public TimeSpan From { get; set; }
        public TimeSpan To { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class ExceptionPeriod
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid CompanyId { get; set; }
        public Company Company { get; set; }
        public Guid? EmployeeId { get; set; }
        public DateTime Date { get; set; }
        public TimeSpan? From { get; set; }
        public TimeSpan? To { get; set; }
        public string Type { get; set; }
        public string Description { get; set; }
    }

    public class NotificationLog
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid CompanyId { get; set; }
        public Guid AppointmentId { get; set; }
        public string Recipient { get; set; }
        public string Type { get; set; }
        public string Status { get; set; }
        public DateTime SentAtUtc { get; set; } = DateTime.UtcNow;
        public string Error { get; set; }
    }

    public class AuditLog
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid CompanyId { get; set; }
        public string Entity { get; set; }
        public string EntityId { get; set; }
        public string Action { get; set; }
        public Guid? UserId { get; set; }
        public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;
        public string Details { get; set; }
    }
}
