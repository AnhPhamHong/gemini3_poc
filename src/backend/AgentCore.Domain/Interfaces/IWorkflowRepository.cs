using AgentCore.Domain.Entities;

namespace AgentCore.Domain.Interfaces;

public interface IWorkflowRepository
{
    Task<Workflow?> GetAsync(Guid id);
    Task<IEnumerable<Workflow>> GetAllAsync();
    Task<(IEnumerable<Workflow> Items, int TotalCount)> GetPagedAsync(
        int pageNumber,
        int pageSize,
        string sortBy,
        bool sortDescending,
        string? filterByState);
    Task SaveAsync(Workflow workflow);
}
