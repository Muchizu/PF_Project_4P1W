namespace auth_api.Models;

public class User 
{
    public int Id { get; set; }
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public string Role { get; set; } = "player";
}

public class AuthRequest 
{
    public required string Email { get; set; }
    public required string Password { get; set; }
}
