using AgentCore.Application.Commands;
using AgentCore.Domain.Entities;
using AgentCore.Domain.Enums;
using AgentCore.Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace AgentCore.Application.Services;

public class OrchestratorService : IOrchestratorService
{
    private readonly IMediator _mediator;
    private readonly IWorkflowRepository _repository;
    private readonly IWorkflowNotificationService _notificationService;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<OrchestratorService> _logger;

    public OrchestratorService(
        IMediator mediator, 
        IWorkflowRepository repository,
        IWorkflowNotificationService notificationService,
        IServiceScopeFactory scopeFactory,
        ILogger<OrchestratorService> logger)
    {
        _mediator = mediator;
        _repository = repository;
        _notificationService = notificationService;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task<Guid> StartWorkflowAsync(string topic, string? tone = null)
    {
        var workflow = new Workflow(topic, tone);
        await _repository.SaveAsync(workflow);
        
        // Start processing in background
        RunInBackground(workflow.Id);
        
        return workflow.Id;
    }

    public async Task ProcessWorkflowAsync(Guid workflowId, int maxIterations = 10)
    {
        // Process workflow until it reaches a state that requires user input or completion
        var iteration = 0;

        while (iteration < maxIterations)
        {
            try
            {
            var workflow = await _repository.GetAsync(workflowId);
            if (workflow == null) throw new ArgumentException("Workflow not found", nameof(workflowId));

            var currentState = workflow.State;
            var shouldContinue = false;

            switch (workflow.State)
            {
                case WorkflowState.Idle:
                    workflow.TransitionTo(WorkflowState.Researching);
                    shouldContinue = true;
                    break;

                case WorkflowState.Researching:
                    var researchData = await _mediator.Send(new ResearchCommand(workflow.Topic));
                    workflow.UpdateResearch(researchData);
                    workflow.TransitionTo(WorkflowState.Outlining);
                    shouldContinue = true;
                    break;

                case WorkflowState.Outlining:
                    if (string.IsNullOrEmpty(workflow.ResearchData)) throw new InvalidOperationException("Research data missing");
                    var outline = await _mediator.Send(new GenerateOutlineCommand(workflow.Topic, workflow.ResearchData));
                    workflow.SetOutline(outline);
                    workflow.TransitionTo(WorkflowState.WaitingApproval);
                    shouldContinue = false; // Stop here - user needs to approve
                    break;

                case WorkflowState.WaitingApproval:
                    // Needs manual intervention - stop processing
                    shouldContinue = false;
                    break;

                case WorkflowState.Drafting:
                     if (string.IsNullOrEmpty(workflow.Outline)) throw new InvalidOperationException("Outline missing");
                    var draft = await _mediator.Send(new GenerateDraftCommand(workflow.Topic, workflow.Outline));
                    workflow.SetDraft(draft);
                    workflow.TransitionTo(WorkflowState.Editing);
                    shouldContinue = true;
                    break;

                case WorkflowState.Editing:
                    if (string.IsNullOrEmpty(workflow.DraftContent)) throw new InvalidOperationException("Draft content missing");
                    var edited = await _mediator.Send(new EditContentCommand(workflow.DraftContent));
                    workflow.SetDraft(edited); // Update draft with edited version
                    workflow.TransitionTo(WorkflowState.Optimizing);
                    shouldContinue = true;
                    break;

                case WorkflowState.Optimizing:
                     if (string.IsNullOrEmpty(workflow.DraftContent)) throw new InvalidOperationException("Draft content missing");
                    var seoResult = await _mediator.Send(new AnalyzeSeoCommand(workflow.DraftContent));
                    // We might store SEO result, but for now just finish
                    workflow.TransitionTo(WorkflowState.Final);
                    shouldContinue = false; // Stop - workflow complete
                    break;
                    
                case WorkflowState.Final:
                    // Already done
                    shouldContinue = false;
                    break;
            }

            await _repository.SaveAsync(workflow);
            
            // Notify connected clients of workflow update
            await _notificationService.NotifyWorkflowUpdatedAsync(workflowId, workflow);

                // If we shouldn't continue or state didn't change, break the loop
                if (!shouldContinue || workflow.State == currentState)
                {
                    break;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing workflow {WorkflowId}", workflowId);
                
                // Handle any error during workflow processing
                try 
                {
                    // We need to reload the workflow to ensure we have a clean state/context if possible,
                    // but since we are in a loop with the same context, we might be in trouble if the context is poisoned.
                    // However, for this POC, we'll try to update the state.
                    var workflow = await _repository.GetAsync(workflowId);
                    if (workflow != null)
                    {
                        workflow.TransitionTo(WorkflowState.Failed);
                        workflow.AddChatMessage("system", $"Workflow failed: {ex.Message}");
                        await _repository.SaveAsync(workflow);
                        await _notificationService.NotifyWorkflowUpdatedAsync(workflowId, workflow);
                    }
                }
                catch (Exception innerEx)
                {
                    _logger.LogError(innerEx, "Error updating workflow {WorkflowId} to Failed state", workflowId);
                }
                
                break; // Stop processing on error
            }

            iteration++;
        }
    }

    public async Task<Workflow?> GetWorkflowAsync(Guid workflowId)
    {
        return await _repository.GetAsync(workflowId);
    }

    public async Task<bool> ApproveOutlineAsync(Guid workflowId, string? notes)
    {
        var workflow = await _repository.GetAsync(workflowId);
        if (workflow == null || workflow.State != WorkflowState.WaitingApproval)
            return false;

        if (!string.IsNullOrEmpty(notes))
        {
            workflow.AddChatMessage("user", $"Outline approved with notes: {notes}");
        }

        workflow.TransitionTo(WorkflowState.Drafting);
        await _repository.SaveAsync(workflow);
        
        // Notify connected clients
        await _notificationService.NotifyWorkflowUpdatedAsync(workflowId, workflow);

        // Trigger background processing
        RunInBackground(workflowId);

        return true;
    }

    public async Task<bool> RejectOutlineAsync(Guid workflowId, string feedback)
    {
        var workflow = await _repository.GetAsync(workflowId);
        if (workflow == null || workflow.State != WorkflowState.WaitingApproval)
            return false;

        workflow.SetFeedback(feedback);
        workflow.AddChatMessage("user", $"Outline rejected: {feedback}");
        workflow.TransitionTo(WorkflowState.Outlining);
        await _repository.SaveAsync(workflow);
        
        // Notify connected clients
        await _notificationService.NotifyWorkflowUpdatedAsync(workflowId, workflow);

        // Trigger background processing to regenerate outline
        RunInBackground(workflowId);

        return true;
    }

    public async Task<bool> ReviseDraftAsync(Guid workflowId, string instructions)
    {
        var workflow = await _repository.GetAsync(workflowId);
        if (workflow == null)
            return false;

        workflow.SetFeedback(instructions);
        workflow.AddChatMessage("user", $"Revision requested: {instructions}");
        
        // Process revision through mediator (could be a new command)
        // For now, we'll transition back to Drafting state
        if (workflow.State == WorkflowState.Editing || workflow.State == WorkflowState.Optimizing || workflow.State == WorkflowState.Final)
        {
            workflow.TransitionTo(WorkflowState.Drafting);
        }

        await _repository.SaveAsync(workflow);
        
        // Notify connected clients
        await _notificationService.NotifyWorkflowUpdatedAsync(workflowId, workflow);

        // Trigger background processing
        RunInBackground(workflowId);

        return true;
    }

    public async Task<string> ProcessChatMessageAsync(Guid workflowId, string message)
    {
        var workflow = await _repository.GetAsync(workflowId);
        if (workflow == null)
            throw new ArgumentException("Workflow not found", nameof(workflowId));

        // Add user message to chat history
        workflow.AddChatMessage("user", message);

        // In a real implementation, this would call the AI agent with the workflow context
        // For now, we'll return a simple response
        var response = $"Received your message: '{message}'. This will be processed in the context of workflow {workflowId}.";
        
        workflow.AddChatMessage("assistant", response);
        await _repository.SaveAsync(workflow);
        
        // Notify connected clients
        await _notificationService.NotifyWorkflowUpdatedAsync(workflowId, workflow);

        return response;
    }
    private void RunInBackground(Guid workflowId)
    {
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var orchestrator = scope.ServiceProvider.GetRequiredService<IOrchestratorService>();
                await orchestrator.ProcessWorkflowAsync(workflowId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error running background workflow {WorkflowId}", workflowId);
            }
        });
    }
}
