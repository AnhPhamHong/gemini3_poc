using AgentCore.Application.Commands;
using AgentCore.Application.DTOs;
using AgentCore.Application.Queries;
using AgentCore.Domain.Interfaces;
using AgentCore.Domain.Enums;
using MediatR;

namespace AgentCore.Application.Handlers;

// Workflow Command Handlers
public class StartWorkflowCommandHandler : IRequestHandler<StartWorkflowCommand, Guid>
{
    private readonly IOrchestratorService _orchestrator;

    public StartWorkflowCommandHandler(IOrchestratorService orchestrator)
    {
        _orchestrator = orchestrator;
    }

    public async Task<Guid> Handle(StartWorkflowCommand request, CancellationToken cancellationToken)
    {
        var workflowId = await _orchestrator.StartWorkflowAsync(request.Topic, request.Tone);
        
        // Trigger initial workflow processing in background
        _ = Task.Run(() => _orchestrator.ProcessWorkflowAsync(workflowId), cancellationToken);
        
        return workflowId;
    }
}

public class ApproveOutlineCommandHandler : IRequestHandler<ApproveOutlineCommand, bool>
{
    private readonly IOrchestratorService _orchestrator;

    public ApproveOutlineCommandHandler(IOrchestratorService orchestrator)
    {
        _orchestrator = orchestrator;
    }

    public async Task<bool> Handle(ApproveOutlineCommand request, CancellationToken cancellationToken)
    {
        return await _orchestrator.ApproveOutlineAsync(request.WorkflowId, request.Notes);
    }
}

public class RejectOutlineCommandHandler : IRequestHandler<RejectOutlineCommand, bool>
{
    private readonly IOrchestratorService _orchestrator;

    public RejectOutlineCommandHandler(IOrchestratorService orchestrator)
    {
        _orchestrator = orchestrator;
    }

    public async Task<bool> Handle(RejectOutlineCommand request, CancellationToken cancellationToken)
    {
        return await _orchestrator.RejectOutlineAsync(request.WorkflowId, request.Feedback);
    }
}

public class ReviseDraftCommandHandler : IRequestHandler<ReviseDraftCommand, bool>
{
    private readonly IOrchestratorService _orchestrator;

    public ReviseDraftCommandHandler(IOrchestratorService orchestrator)
    {
        _orchestrator = orchestrator;
    }

    public async Task<bool> Handle(ReviseDraftCommand request, CancellationToken cancellationToken)
    {
        return await _orchestrator.ReviseDraftAsync(request.WorkflowId, request.Instructions);
    }
}

public class ChatCommandHandler : IRequestHandler<ChatCommand, string>
{
    private readonly IOrchestratorService _orchestrator;

    public ChatCommandHandler(IOrchestratorService orchestrator)
    {
        _orchestrator = orchestrator;
    }

    public async Task<string> Handle(ChatCommand request, CancellationToken cancellationToken)
    {
        return await _orchestrator.ProcessChatMessageAsync(request.WorkflowId, request.Message);
    }
}

// Workflow Query Handler
public class GetWorkflowQueryHandler : IRequestHandler<GetWorkflowQuery, WorkflowDto>
{
    private readonly IOrchestratorService _orchestrator;

    public GetWorkflowQueryHandler(IOrchestratorService orchestrator)
    {
        _orchestrator = orchestrator;
    }

    public async Task<WorkflowDto> Handle(GetWorkflowQuery request, CancellationToken cancellationToken)
    {
        var workflow = await _orchestrator.GetWorkflowAsync(request.WorkflowId);
        
        if (workflow == null)
            throw new KeyNotFoundException($"Workflow {request.WorkflowId} not found");

        // Map domain entity to DTO
        return new WorkflowDto
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
