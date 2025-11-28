using AgentCore.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AgentCore.Infrastructure.Persistence;

public class AgentCoreDbContext : DbContext
{
    public AgentCoreDbContext(DbContextOptions<AgentCoreDbContext> options) : base(options)
    {
    }

    public DbSet<Workflow> Workflows { get; set; }
    public DbSet<Blog> Blogs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasPostgresExtension("vector");

        modelBuilder.Entity<Workflow>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Topic).IsRequired();
            entity.Property(e => e.State).HasConversion<string>();
            
            entity.Property(e => e.ChatHistory)
                .HasConversion(
                    v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                    v => System.Text.Json.JsonSerializer.Deserialize<List<ChatMessage>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<ChatMessage>()
                );
        });

        modelBuilder.Entity<Blog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Embedding).HasColumnType("vector(768)"); // Adjust dimension as needed
        });
    }
}
