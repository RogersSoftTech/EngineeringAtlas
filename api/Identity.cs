using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace EngineeringAtlas.Api;

public sealed record AtlasUser(string Owner, string DisplayName)
{
    public static AtlasUser FromPrincipal(string? encoded)
    {
        try
        {
            if (string.IsNullOrEmpty(encoded) || encoded.Length > 16384) throw new ApiException(401, "SIGN_IN_REQUIRED", "Sign in to save your learning data.");
            using var doc = JsonDocument.Parse(Convert.FromBase64String(encoded));
            var principal = doc.RootElement;
            var userId = principal.GetProperty("userId").GetString();
            var provider = principal.GetProperty("identityProvider").GetString();
            if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(provider)) throw new FormatException();
            var roles = principal.GetProperty("userRoles").EnumerateArray().Select(v => v.GetString()).ToHashSet();
            if (!roles.Contains("authenticated") || !roles.Contains("atlas_reader")) throw new ApiException(403, "ACCESS_DENIED", "This workspace is invite-only.");
            var owner = Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(provider + "\0" + userId)));
            var name = principal.TryGetProperty("userDetails", out var details) ? details.GetString() ?? "Your account" : "Your account";
            return new AtlasUser(owner, name);
        }
        catch (ApiException) { throw; }
        catch { throw new ApiException(401, "SIGN_IN_REQUIRED", "Sign in to save your learning data."); }
    }
}

public sealed class ApiException(int status, string code, string message) : Exception(message)
{
    public int Status { get; } = status;
    public string Code { get; } = code;
}
