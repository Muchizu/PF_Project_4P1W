using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;
using resource_api.Data;
using resource_api.Models;
using System.Text.Json;
using System.IdentityModel.Tokens.Jwt;

var builder = WebApplication.CreateBuilder(args);

// DbContext
builder.Services.AddDbContext<ResourceDbContext>(options =>
    options.UseSqlite("Data Source=resources.db"));

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyHeader()
               .AllowAnyMethod();
    });
});

// JWT
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
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            RoleClaimType = ClaimTypes.Role,
            NameClaimType = JwtRegisteredClaimNames.Sub
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("admin"));
});

var app = builder.Build();
app.UseCors("AllowReact");

// Static files for Image URL uploads
app.UseStaticFiles(); 

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ResourceDbContext>();
    db.Database.EnsureCreated();
}

app.UseAuthentication();
app.UseAuthorization();

// --- CMS (Admin) ---

var cms = app.MapGroup("/cms").RequireAuthorization("AdminOnly");

// Tags
cms.MapGet("/tags", async (ResourceDbContext db) => await db.Tags.ToListAsync());
cms.MapPost("/tags", async (Tag tag, ResourceDbContext db) => {
    db.Tags.Add(tag);
    await db.SaveChangesAsync();
    return Results.Created($"/cms/tags/{tag.Id}", tag);
});
cms.MapDelete("/tags/{id}", async (int id, ResourceDbContext db) => {
    var tag = await db.Tags.FindAsync(id);
    if(tag == null) return Results.NotFound();
    db.Tags.Remove(tag);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// Images
cms.MapGet("/images", async (ResourceDbContext db) => 
    await db.Images.Include(i => i.Tags).ToListAsync());

cms.MapPost("/images", async (HttpRequest req, ResourceDbContext db) => {
    if(!req.HasFormContentType) return Results.BadRequest();
    var form = await req.ReadFormAsync();
    var newImages = new List<Image>();
    
    foreach(var file in form.Files)
    {
        var fileName = $"{Guid.NewGuid()}_{file.FileName}";
        var path = Path.Combine(builder.Environment.WebRootPath ?? "wwwroot", "uploads", fileName);
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        using var stream = File.Create(path);
        await file.CopyToAsync(stream);
        
        var img = new Image { Url = $"/uploads/{fileName}" };
        db.Images.Add(img);
        newImages.Add(img);
    }
    await db.SaveChangesAsync();
    return Results.Ok(newImages);
}).DisableAntiforgery();

cms.MapDelete("/images/{id}", async (int id, ResourceDbContext db) => {
    var img = await db.Images.FindAsync(id);
    if(img == null) return Results.NotFound();
    db.Images.Remove(img); 
    await db.SaveChangesAsync();
    return Results.NoContent();
});

cms.MapPost("/images/{id}/tags", async (int id, TagAssignReq req, ResourceDbContext db) => {
    var img = await db.Images.Include(i => i.Tags).FirstOrDefaultAsync(i => i.Id == id);
    if(img == null) return Results.NotFound();
    
    var tags = await db.Tags.Where(t => req.TagIds.Contains(t.Id)).ToListAsync();
    foreach(var t in tags) {
        if(!img.Tags.Any(it => it.Id == t.Id)) img.Tags.Add(t);
    }
    await db.SaveChangesAsync();
    return Results.Ok(img);
});

// Packs
cms.MapGet("/packs", async (ResourceDbContext db) => await db.Packs.ToListAsync());
cms.MapPost("/packs", async (Pack pack, ResourceDbContext db) => {
    db.Packs.Add(pack);
    await db.SaveChangesAsync();
    return Results.Ok(pack);
});
cms.MapPost("/packs/{id}/publish", async (int id, ResourceDbContext db) => {
    var p = await db.Packs.FindAsync(id);
    if(p == null) return Results.NotFound();
    p.IsPublished = !p.IsPublished;
    await db.SaveChangesAsync();
    return Results.Ok(p);
});
cms.MapDelete("/packs/{id}", async (int id, ResourceDbContext db) => {
    var p = await db.Packs.FindAsync(id);
    if(p == null) return Results.NotFound();
    db.Packs.Remove(p);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// Puzzles
cms.MapGet("/puzzles", async (ResourceDbContext db) => 
    await db.Puzzles.Include(p => p.Images).Include(p => p.Pack).ToListAsync());

cms.MapPost("/puzzles", async (PuzzleReq req, ResourceDbContext db) => {
    if(req.ImageIds.Count != 4) return Results.BadRequest("Exactly 4 images required");
    var images = await db.Images.Where(i => req.ImageIds.Contains(i.Id)).ToListAsync();
    if(images.Count != 4) return Results.BadRequest("One or more images not found");
    
    var puzzle = new Puzzle {
        Answer = req.Answer.ToLower().Trim(),
        Hint = req.Hint,
        Difficulty = req.Difficulty,
        PackId = req.PackId,
        Images = images
    };
    db.Puzzles.Add(puzzle);
    await db.SaveChangesAsync();
    return Results.Ok(puzzle);
});

// --- PLAYER APIs ---
var player = app.MapGroup("").RequireAuthorization();

player.MapGet("/packs", async (bool? random, ResourceDbContext db) => {
    var query = db.Packs.Where(p => p.IsPublished);
    if(random == true) 
        query = query.OrderBy(x => EF.Functions.Random());
    return await query.ToListAsync();
});

player.MapGet("/puzzles/next", async (int packId, ClaimsPrincipal user, ResourceDbContext db) => {
    var userIdStr = user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0";
    int userId = int.TryParse(userIdStr, out var u) ? u : 0;
    
    var progress = await db.UserProgress.FirstOrDefaultAsync(up => up.UserId == userId && up.PackId == packId);
    var solvedIds = new List<int>();
    if(progress != null) {
        solvedIds = JsonSerializer.Deserialize<List<int>>(progress.SolvedPuzzleIds) ?? new List<int>();
    }
    
    var nxt = await db.Puzzles
        .Include(p => p.Images)
        .Where(p => p.PackId == packId && !solvedIds.Contains(p.Id))
        .OrderBy(x => EF.Functions.Random())
        .FirstOrDefaultAsync();

    if(nxt == null) return Results.NotFound(new { message = "Pack completed!" });
    
    return Results.Ok(new {
        id = nxt.Id, hint = nxt.Hint, images = nxt.Images.Select(i => i.Url).ToList()
    });
});

player.MapPost("/game/submit", async (GameplaySubmitReq req, ClaimsPrincipal user, ResourceDbContext db) => {
    var puzzle = await db.Puzzles.FindAsync(req.PuzzleId);
    if(puzzle == null) return Results.NotFound();
    
    var correct = puzzle.Answer.Equals(req.Guess.Trim(), StringComparison.OrdinalIgnoreCase);
    if(correct) {
        var userIdStr = user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0";
        int userId = int.TryParse(userIdStr, out var u) ? u : 0;
        
        var progress = await db.UserProgress.FirstOrDefaultAsync(up => up.UserId == userId && up.PackId == puzzle.PackId);
        if(progress == null) {
            progress = new UserProgress { UserId = userId, PackId = puzzle.PackId };
            db.UserProgress.Add(progress);
        }
        var solvedIds = JsonSerializer.Deserialize<List<int>>(progress.SolvedPuzzleIds) ?? new List<int>();
        if(!solvedIds.Contains(puzzle.Id)) {
            solvedIds.Add(puzzle.Id);
            progress.SolvedPuzzleIds = JsonSerializer.Serialize(solvedIds);
        }
        await db.SaveChangesAsync();
    }
    
    return Results.Ok(new { correct });
});

player.MapGet("/profile/progress", async (ClaimsPrincipal user, ResourceDbContext db) => {
    var userIdStr = user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0";
    int userId = int.TryParse(userIdStr, out var u) ? u : 0;
    
    var progresses = await db.UserProgress.Where(up => up.UserId == userId).ToListAsync();
    
    int solvedCount = progresses.Sum(p => {
        var l = JsonSerializer.Deserialize<List<int>>(p.SolvedPuzzleIds);
        return l?.Count ?? 0;
    });
    
    return Results.Ok(new {
        SolvedCount = solvedCount,
        Attempts = solvedCount // Basic metric
    });
});

app.Run();

// Top Level Request Classes must be at bottom
public class TagAssignReq { public List<int> TagIds { get; set; } = new(); }

public class PuzzleReq {
    public string Answer { get; set; } = "";
    public string Hint { get; set; } = "";
    public int Difficulty { get; set; }
    public int PackId { get; set; }
    public List<int> ImageIds { get; set; } = new();
}
