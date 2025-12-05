using AgentCore.Domain.Entities;
using AgentCore.Domain.Interfaces;
using AgentCore.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AgentCore.Infrastructure.Persistence;

public class WorkflowRepository : IWorkflowRepository
{
    private readonly AgentCoreDbContext _context;

    public WorkflowRepository(AgentCoreDbContext context)
    {
        _context = context;
    }

    public async Task<Workflow?> GetAsync(Guid id)
    {
        return await _context.Workflows.FindAsync(id);
    }

    public async Task<IEnumerable<Workflow>> GetAllAsync()
    {
        return await _context.Workflows.OrderByDescending(w => w.CreatedAt).ToListAsync();
    }

    public async Task<(IEnumerable<Workflow> Items, int TotalCount)> GetPagedAsync(
        int pageNumber,
        int pageSize,
        string sortBy,
        bool sortDescending,
        string? filterByState)
    {
        // Start with base query using AsNoTracking for performance
        var query = _context.Workflows.AsNoTracking();

        // Apply state filter if provided
        if (!string.IsNullOrWhiteSpace(filterByState))
        {
            query = query.Where(w => w.State.ToString() == filterByState);
        }

        // Apply sorting based on field
        query = sortBy?.ToLower() switch
        {
            "updatedat" => sortDescending
                ? query.OrderByDescending(w => w.UpdatedAt)
                : query.OrderBy(w => w.UpdatedAt),
            "topic" => sortDescending
                ? query.OrderByDescending(w => w.Topic)
                : query.OrderBy(w => w.Topic),
            _ => sortDescending // Default to CreatedAt
                ? query.OrderByDescending(w => w.CreatedAt)
                : query.OrderBy(w => w.CreatedAt)
        };

        // Get total count before pagination
        var totalCount = await query.CountAsync();

        // Apply pagination
        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task SaveAsync(Workflow workflow)
    {
        if (_context.Entry(workflow).State == EntityState.Detached)
        {
            await _context.Workflows.AddAsync(workflow);
        }
        await _context.SaveChangesAsync();
    }
}
