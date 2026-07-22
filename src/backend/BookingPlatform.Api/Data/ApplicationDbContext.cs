using System;
using BookingPlatform.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace BookingPlatform.Api.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<Company> Companies { get; set; }
        public DbSet<AppUser> Users { get; set; }
        public DbSet<Employee> Employees { get; set; }
        public DbSet<Service> Services { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<BusinessHour> BusinessHours { get; set; }
        public DbSet<ExceptionPeriod> ExceptionPeriods { get; set; }
        public DbSet<NotificationLog> Notifications { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Company>()
                .HasIndex(x => x.Subdomain)
                .IsUnique();

            modelBuilder.Entity<AppUser>()
                .HasIndex(x => new { x.CompanyId, x.Email })
                .IsUnique();

            modelBuilder.Entity<AppUser>()
                .HasOne(x => x.Employee)
                .WithMany()
                .HasForeignKey(x => x.EmployeeId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Customer>()
                .HasIndex(x => new { x.CompanyId, x.Email });

            modelBuilder.Entity<Service>()
                .Property(x => x.Price)
                .HasColumnType("decimal(10,2)");

            modelBuilder.Entity<Appointment>()
                .HasIndex(x => new { x.CompanyId, x.StartTimeUtc });

            var utcDateTimeConverter = new ValueConverter<DateTime, DateTime>(
                v => v.Kind == DateTimeKind.Utc
                    ? v
                    : (v.Kind == DateTimeKind.Local
                        ? v.ToUniversalTime()
                        : DateTime.SpecifyKind(v, DateTimeKind.Utc)),
                v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

            modelBuilder.Entity<Appointment>().Property(x => x.StartTimeUtc).HasConversion(utcDateTimeConverter);
            modelBuilder.Entity<Appointment>().Property(x => x.EndTimeUtc).HasConversion(utcDateTimeConverter);
            modelBuilder.Entity<Appointment>().Property(x => x.CreatedAtUtc).HasConversion(utcDateTimeConverter);
            modelBuilder.Entity<NotificationLog>().Property(x => x.SentAtUtc).HasConversion(utcDateTimeConverter);
            modelBuilder.Entity<AuditLog>().Property(x => x.TimestampUtc).HasConversion(utcDateTimeConverter);

            modelBuilder.Entity<AuditLog>()
                .HasIndex(x => new { x.CompanyId, x.TimestampUtc });
            base.OnModelCreating(modelBuilder);
        }
    }
}
