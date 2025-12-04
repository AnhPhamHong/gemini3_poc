using AgentCore.Application.DTOs;
using AgentCore.Domain.Entities;
using AgentCore.Domain.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace AgentCore.Api.Services;

public class WorkflowNotificationService : IWorkflowNotificationService
{
    private readonly IHubContext<Hubs.WorkflowHub> _hubContext;
    private readonly ILogger<WorkflowNotificationService> _logger;

    public WorkflowNotificationService(
        IHubContext<Hubs.WorkflowHub> hubContext,
        ILogger<WorkflowNotificationService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task NotifyWorkflowUpdatedAsync(Guid workflowId, Workflow workflow)
    {
        try
        {
            var workflowDto = MapToDto(workflow);
            var groupName = $"workflow-{workflowId}";

            await _hubContext.Clients.Group(groupName).SendAsync("WorkflowUpdated", workflowDto);

            _logger.LogInformation("Notified workflow group {GroupName} of update. State: {State}, Outline Length: {OutlineLength}", 
                groupName, workflowDto.State, workflowDto.Data.Outline?.Length ?? -1);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send workflow update notification for {WorkflowId}", workflowId);
            // Don't throw - notification failure shouldn't break workflow processing
        }
    }

    private static WorkflowDto MapToDto(Workflow workflow)
    {
        return new WorkflowDto
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
