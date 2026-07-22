using System.Linq;
using System.Threading.Tasks;
using BookingPlatform.Api.Data;
using BookingPlatform.Api.Dtos;
using BookingPlatform.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookingPlatform.Api.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly IPasswordHasher _passwordHasher;
        private readonly ITokenService _tokenService;

        public AuthController(ApplicationDbContext db, IPasswordHasher passwordHasher, ITokenService tokenService)
        {
            _db = db;
            _passwordHasher = passwordHasher;
            _tokenService = tokenService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var company = await _db.Companies.FirstOrDefaultAsync(c => c.Subdomain == request.Subdomain && c.IsActive);
            if (company == null)
            {
                return Unauthorized();
            }

            var user = await _db.Users.FirstOrDefaultAsync(u => u.CompanyId == company.Id && u.Email == request.Email);
            if (user == null)
            {
                return Unauthorized();
            }

            if (!_passwordHasher.Verify(request.Password, user.PasswordHash, user.PasswordSalt))
            {
                return Unauthorized();
            }

            var tokenResult = _tokenService.CreateToken(user, company);

            return Ok(new LoginResponse
            {
                Token = tokenResult.Token,
                ExpiresAtUtc = tokenResult.ExpiresAtUtc,
                Role = user.Role.ToString(),
                CompanyId = company.Id
            });
        }
    }
}
