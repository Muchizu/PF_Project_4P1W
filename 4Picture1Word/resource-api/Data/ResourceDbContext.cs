using Microsoft.EntityFrameworkCore;
using resource_api.Models;

namespace resource_api.Data;

public class ResourceDbContext : DbContext
{
    public ResourceDbContext(DbContextOptions<ResourceDbContext> options) : base(options) { }

    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<Image> Images => Set<Image>();
    public DbSet<Pack> Packs => Set<Pack>();
    public DbSet<Puzzle> Puzzles => Set<Puzzle>();
    public DbSet<UserProgress> UserProgress => Set<UserProgress>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Image>()
            .HasMany(i => i.Tags)
            .WithMany(t => t.Images)
            .UsingEntity(j => j.ToTable("ImageTags"));
            
        modelBuilder.Entity<Image>()
            .HasMany(i => i.Puzzles) // needs reciprocal? no, let's just make it a many-to-many
            .WithMany(p => p.Images)
            .UsingEntity(j => j.ToTable("PuzzleImages"));
            
        base.OnModelCreating(modelBuilder);
    }
}
