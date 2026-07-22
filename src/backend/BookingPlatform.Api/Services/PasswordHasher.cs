using System;
using System.Security.Cryptography;

namespace BookingPlatform.Api.Services
{
    public interface IPasswordHasher
    {
        (string hash, string salt) Hash(string password);
        bool Verify(string password, string hash, string salt);
    }

    public class PasswordHasher : IPasswordHasher
    {
        public (string hash, string salt) Hash(string password)
        {
            using var rng = RandomNumberGenerator.Create();
            var saltBytes = new byte[16];
            rng.GetBytes(saltBytes);

            var hashBytes = Derive(password, saltBytes);
            return (Convert.ToBase64String(hashBytes), Convert.ToBase64String(saltBytes));
        }

        public bool Verify(string password, string hash, string salt)
        {
            var expected = Convert.FromBase64String(hash);
            var saltBytes = Convert.FromBase64String(salt);
            var actual = Derive(password, saltBytes);
            return CryptographicOperations.FixedTimeEquals(actual, expected);
        }

        private static byte[] Derive(string password, byte[] salt)
        {
            using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 10000, HashAlgorithmName.SHA256);
            return pbkdf2.GetBytes(32);
        }
    }
}
