using auth_api.Models;
using Microsoft.EntityFrameworkCore;

namespace auth_api.Data;

public class AuthDbContext : DbContext 
{
    public AuthDbContext(DbContextOptions<AuthDbContext> options) : base(options) { }
    
    public DbSet<User> Users => Set<User>();
}
