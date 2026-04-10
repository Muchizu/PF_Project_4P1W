using auth_api.Data;
using auth_api.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Adds CORS policy so the web-app can call it
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyHeader()
               .AllowAnyMethod();
    });
});

// DbContext
builder.Services.AddDbContext<AuthDbContext>(options =>
    options.UseSqlite("Data Source=auth.db"));

// JWT setup
var jwtKey = builder.Configuration["Jwt:Key"] ?? "This_Is_A_Super_Secret_Key_For_This_Game_123456789";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "auth-api";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "4pics1word";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });
builder.Services.AddAuthorization();

var app = builder.Build();

app.UseCors("AllowReact");

// Database initialize
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
    db.Database.EnsureCreated();
    
    // Seed new simple admin if not exist
    if (!db.Users.Any(u => u.Email == "admin"))
    {
        db.Users.Add(new User { Email = "admin", PasswordHash = "admin", Role = "admin" });
        db.SaveChanges();
    }

    // Seed new simple player if not exist
    if (!db.Users.Any(u => u.Email == "player"))
    {
        db.Users.Add(new User { Email = "player", PasswordHash = "player", Role = "player" });
        db.SaveChanges();
    }
}

app.UseAuthentication();
app.UseAuthorization();

app.MapPost("/register", async (AuthRequest req, AuthDbContext db) =>
{
    if (await db.Users.AnyAsync(u => u.Email == req.Email))
        return Results.BadRequest(new { error = "Email already exists." });

    var user = new User
    {
        Email = req.Email,
        PasswordHash = req.Password,
        Role = "player" // default
    };

    db.Users.Add(user);
    await db.SaveChangesAsync();

    return Results.Ok(new { message = "Registration successful." });
});

app.MapPost("/login", async (AuthRequest req, AuthDbContext db) =>
{
    var user = await db.Users.FirstOrDefaultAsync(u => u.Email == req.Email && u.PasswordHash == req.Password);
    if (user == null)
        return Results.Unauthorized();

    var tokenHandler = new JwtSecurityTokenHandler();
    var key = Encoding.UTF8.GetBytes(jwtKey);
    var tokenDescriptor = new SecurityTokenDescriptor
    {
        Subject = new ClaimsIdentity(new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role)
        }),
        Expires = DateTime.UtcNow.AddDays(7),
        Issuer = jwtIssuer,
        Audience = jwtAudience,
        SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
    };

    var token = tokenHandler.CreateToken(tokenDescriptor);
    return Results.Ok(new { token = tokenHandler.WriteToken(token), role = user.Role });
});

app.Run();
