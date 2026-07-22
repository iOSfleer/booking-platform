using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using BookingPlatform.Api.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace BookingPlatform.Api.Services
{
    public interface ITokenService
    {
        TokenResult CreateToken(AppUser user, Company company);
    }

    public class TokenResult
    {
        public string Token { get; set; }
        public DateTime ExpiresAtUtc { get; set; }
    }

    public class TokenService : ITokenService
    {
        private readonly IConfiguration _configuration;

        public TokenService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public TokenResult CreateToken(AppUser user, Company company)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expiresAtUtc = GetEndOfCurrentDayUtc();

            var employeeClaim = user.EmployeeId.HasValue ? new Claim("employeeId", user.EmployeeId.Value.ToString()) : null;

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim("companyId", company.Id.ToString()),
                new Claim("subdomain", company.Subdomain),
                new Claim(ClaimTypes.Role, user.Role.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                employeeClaim
            }.Where(c => c != null).ToArray();

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: expiresAtUtc,
                signingCredentials: creds
            );

            return new TokenResult
            {
                Token = new JwtSecurityTokenHandler().WriteToken(token),
                ExpiresAtUtc = expiresAtUtc
            };
        }

        private static DateTime GetEndOfCurrentDayUtc()
        {
            var timeZone = GetCompanyTimeZone();
            var localNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZone);
            var localEndOfDay = localNow.Date.AddDays(1).AddTicks(-1);
            var unspecified = DateTime.SpecifyKind(localEndOfDay, DateTimeKind.Unspecified);
            return TimeZoneInfo.ConvertTimeToUtc(unspecified, timeZone);
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
    }
}
