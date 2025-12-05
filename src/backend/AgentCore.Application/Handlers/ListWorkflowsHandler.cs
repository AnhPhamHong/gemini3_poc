using AgentCore.Application.DTOs;
using AgentCore.Application.Queries;
using AgentCore.Domain.Interfaces;
using MediatR;

namespace AgentCore.Application.Handlers;

public class ListWorkflowsHandler : IRequestHandler<ListWorkflowsQuery, PagedResult<WorkflowDto>>
{
    private readonly IOrchestratorService _orchestrator;

    public ListWorkflowsHandler(IOrchestratorService orchestrator)
    {
        _orchestrator = orchestrator;
    }

    public async Task<PagedResult<WorkflowDto>> Handle(ListWorkflowsQuery request, CancellationToken cancellationToken)
    {
        // Validate input parameters
        if (request.PageNumber < 1)
        {
            throw new ArgumentException("Page number must be greater than 0", nameof(request.PageNumber));
        }

        if (request.PageSize < 1 || request.PageSize > 100)
        {
            throw new ArgumentException("Page size must be between 1 and 100", nameof(request.PageSize));
        }

        // Get paginated workflows from repository
        var (workflows, totalCount) = await _orchestrator.GetPagedWorkflowsAsync(
            request.PageNumber,
            request.PageSize,
            request.SortBy ?? "CreatedAt",
            request.SortDescending,
            request.FilterByState);

        // Map workflows to DTOs
        var workflowDtos = workflows.Select(workflow => new WorkflowDto
        {
            Id = workflow.Id,
            Topic = workflow.Topic,
            Tone = workflow.Tone,
            State = workflow.State.ToString(),
            CurrentStep = GetCurrentStepDescription(workflow.State.ToString()),
            Data = new WorkflowDataDto
            {
                Research = workflow.ResearchData,
                Outline = workflow.Outline,
                Draft = string.IsNullOrEmpty(workflow.DraftContent) ? null : new DraftDto
                {
                    Content = workflow.DraftContent,
                    MetaTitle = "", // TODO: Extract from content
                    MetaDescription = "",
                    SeoScore = 0
                },
                
                // Edited Draft Storage fields
                OriginalDraft = workflow.OriginalDraft,
                EditedDraft = workflow.EditedDraft,
                EditChanges = workflow.GetEditChanges(),
                SeoData = string.IsNullOrEmpty(workflow.SeoData) 
                    ? null 
                    : System.Text.Json.JsonSerializer.Deserialize<AgentCore.Application.Workflows.DTOs.SeoAnalysisResult>(workflow.SeoData)
            },
            CreatedAt = workflow.CreatedAt,
            UpdatedAt = workflow.UpdatedAt
        }).ToList();

        // Create and return PagedResult
        return new PagedResult<WorkflowDto>
        {
            Items = workflowDtos,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize,
            TotalCount = totalCount
        };
    }

    private static string GetCurrentStepDescription(string state)
    {
        return state switch
        {
            "Idle" => "Initializing workflow",
            "Researching" => "Researching topic",
            "Outlining" => "Generating outline",
            "WaitingApproval" => "Waiting for outline approval",
            "Drafting" => "Drafting content",
            "Editing" => "Editing and refining",
            "Optimizing" => "Optimizing for SEO",
            "Final" => "Completed",
            _ => state
        };
    }
}
