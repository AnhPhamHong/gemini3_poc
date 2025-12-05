using AgentCore.Application.DTOs;
using MediatR;

namespace AgentCore.Application.Queries;

public record ListWorkflowsQuery : IRequest<PagedResult<WorkflowDto>>
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    public string? SortBy { get; init; } = "CreatedAt";
    public bool SortDescending { get; init; } = true;
    public string? FilterByState { get; init; } = null;
}
