using System.Text.Json.Serialization;

namespace resource_api.Models;

public class Tag
{
    public int Id { get; set; }
    public required string Name { get; set; }
    
    [JsonIgnore]
    public ICollection<Image> Images { get; set; } = new List<Image>();
}

public class Image
{
    public int Id { get; set; }
    public required string Url { get; set; }
    public ICollection<Tag> Tags { get; set; } = new List<Tag>();
    [JsonIgnore]
    public ICollection<Puzzle> Puzzles { get; set; } = new List<Puzzle>();
}

public class Pack
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string Description { get; set; } = string.Empty;
    public bool IsPublished { get; set; } = false;
    public int Order { get; set; } = 0;
    
    public ICollection<Puzzle> Puzzles { get; set; } = new List<Puzzle>();
}

public class Puzzle
{
    public int Id { get; set; }
    public required string Answer { get; set; }
    public string Hint { get; set; } = string.Empty;
    public int Difficulty { get; set; } = 1;
    
    public int PackId { get; set; }
    [JsonIgnore]
    public Pack? Pack { get; set; }
    
    // We expect exactly 4 images here, enforced in CMS
    public ICollection<Image> Images { get; set; } = new List<Image>();
}

public class UserProgress
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int PackId { get; set; }
    public string SolvedPuzzleIds { get; set; } = "[]"; // JSON array of ints
    public bool Completed { get; set; } = false;
}

public class GameplaySubmitReq
{
    public int PuzzleId { get; set; }
    public required string Guess { get; set; }
}
