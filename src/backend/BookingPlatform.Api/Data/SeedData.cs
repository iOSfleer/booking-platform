using System;
using System.Linq;
using System.Threading.Tasks;
using BookingPlatform.Api.Models;
using BookingPlatform.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace BookingPlatform.Api.Data
{
    public static class SeedData
    {
        public static async Task Initialize(ApplicationDbContext db, IPasswordHasher hasher)
        {
            await db.Database.EnsureCreatedAsync();
            await ApplySchemaUpgrades(db);

            if (await db.Companies.AnyAsync())
            {
                var existingCompany = await db.Companies.FirstAsync();
                var employees = await db.Employees.Where(e => e.CompanyId == existingCompany.Id).ToListAsync();
                if (!employees.Any())
                {
                    employees.Add(new Employee { CompanyId = existingCompany.Id, Name = "Anna", RoleName = "Stylistin", IsActive = true });
                    employees.Add(new Employee { CompanyId = existingCompany.Id, Name = "Mara", RoleName = "Stylistin", IsActive = true });
                    db.Employees.AddRange(employees);
                    await db.SaveChangesAsync();
                }

                if (!await db.Users.AnyAsync(u => u.CompanyId == existingCompany.Id && u.Role == UserRole.Employee))
                {
                    var employee = employees.First();
                    var (empHash, empSalt) = hasher.Hash("Mitarbeiter123!");
                    db.Users.Add(new AppUser
                    {
                        CompanyId = existingCompany.Id,
                        EmployeeId = employee.Id,
                        Name = employee.Name,
                        Email = "mitarbeiter@salon-beispiel.local",
                        PasswordHash = empHash,
                        PasswordSalt = empSalt,
                        Role = UserRole.Employee
                    });

                    await db.SaveChangesAsync();
                }

                return;
            }

            var company = new Company
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Name = "Salon Beispiel",
                Subdomain = "salon-beispiel",
                ContactEmail = "info@salon-beispiel.local",
                PrimaryColor = "#7c3aed"
            };

            var employee1 = new Employee { Company = company, Name = "Anna", RoleName = "Stylistin", IsActive = true };
            var employee2 = new Employee { Company = company, Name = "Mara", RoleName = "Stylistin", IsActive = true };

            var service1 = new Service { Company = company, Name = "Haarschnitt", Description = "Klassischer Haarschnitt", DurationMinutes = 30, Price = 35m };
            var service2 = new Service { Company = company, Name = "Färben", Description = "Komplettfärbung", DurationMinutes = 60, Price = 70m };

            db.BusinessHours.AddRange(
                new BusinessHour { Company = company, DayOfWeek = DayOfWeek.Monday, From = new TimeSpan(8, 0, 0), To = new TimeSpan(18, 0, 0) },
                new BusinessHour { Company = company, DayOfWeek = DayOfWeek.Tuesday, From = new TimeSpan(8, 0, 0), To = new TimeSpan(18, 0, 0) },
                new BusinessHour { Company = company, DayOfWeek = DayOfWeek.Wednesday, From = new TimeSpan(8, 0, 0), To = new TimeSpan(18, 0, 0) },
                new BusinessHour { Company = company, DayOfWeek = DayOfWeek.Thursday, From = new TimeSpan(8, 0, 0), To = new TimeSpan(18, 0, 0) },
                new BusinessHour { Company = company, DayOfWeek = DayOfWeek.Friday, From = new TimeSpan(8, 0, 0), To = new TimeSpan(18, 0, 0) }
            );

            var (adminHash, adminSalt) = hasher.Hash("Admin123!");
            var (employeeHash, employeeSalt) = hasher.Hash("Mitarbeiter123!");

            db.Users.Add(new AppUser
            {
                Company = company,
                Name = "Admin",
                Email = "admin@salon-beispiel.local",
                PasswordHash = adminHash,
                PasswordSalt = adminSalt,
                Role = UserRole.Administrator
            });

            db.Users.Add(new AppUser
            {
                Company = company,
                Employee = employee1,
                Name = employee1.Name,
                Email = "mitarbeiter@salon-beispiel.local",
                PasswordHash = employeeHash,
                PasswordSalt = employeeSalt,
                Role = UserRole.Employee
            });

            db.Services.AddRange(service1, service2);
            db.Employees.AddRange(employee1, employee2);
            db.Companies.Add(company);

            await db.SaveChangesAsync();
        }

        private static async Task ApplySchemaUpgrades(ApplicationDbContext db)
        {
            await db.Database.ExecuteSqlRawAsync("ALTER TABLE \"Users\" ADD COLUMN IF NOT EXISTS \"EmployeeId\" uuid NULL;");
            await db.Database.ExecuteSqlRawAsync("CREATE TABLE IF NOT EXISTS \"Notifications\" (\"Id\" uuid NOT NULL PRIMARY KEY, \"CompanyId\" uuid NOT NULL, \"AppointmentId\" uuid NOT NULL, \"Recipient\" text NULL, \"Type\" text NULL, \"Status\" text NULL, \"SentAtUtc\" timestamp without time zone NOT NULL, \"Error\" text NULL);");
            await db.Database.ExecuteSqlRawAsync("CREATE TABLE IF NOT EXISTS \"AuditLogs\" (\"Id\" uuid NOT NULL PRIMARY KEY, \"CompanyId\" uuid NOT NULL, \"Entity\" text NULL, \"EntityId\" text NULL, \"Action\" text NULL, \"UserId\" uuid NULL, \"TimestampUtc\" timestamp without time zone NOT NULL, \"Details\" text NULL);");
            await db.Database.ExecuteSqlRawAsync("CREATE INDEX IF NOT EXISTS \"IX_AuditLogs_CompanyId_TimestampUtc\" ON \"AuditLogs\" (\"CompanyId\", \"TimestampUtc\");");
        }
    }
}
