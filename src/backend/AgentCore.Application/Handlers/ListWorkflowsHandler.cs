using AgentCore.Application.DTOs;
using AgentCore.Application.Queries;
using AgentCore.Domain.Interfaces;
using MediatR;

namespace AgentCore.Application.Handlers;

public class ListWorkflowsHandler : IRequestHandler<ListWorkflowsQuery, IEnumerable<WorkflowDto>>
{
    private readonly IOrchestratorService _orchestrator;

    public ListWorkflowsHandler(IOrchestratorService orchestrator)
    {
        _orchestrator = orchestrator;
    }

    public async Task<IEnumerable<WorkflowDto>> Handle(ListWorkflowsQuery request, CancellationToken cancellationToken)
    {
        var workflows = await _orchestrator.GetAllWorkflowsAsync();

        return workflows.Select(workflow => new WorkflowDto
        {
            Id = workflow.Id,
            Topic = workflow.Topic,
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
                EditChanges = workflow.GetEditChanges()
            },
            CreatedAt = workflow.CreatedAt,
            UpdatedAt = workflow.UpdatedAt
        });
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
