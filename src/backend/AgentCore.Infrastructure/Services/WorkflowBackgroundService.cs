using AgentCore.Application.Interfaces;
using AgentCore.Domain.Interfaces;
using AgentCore.Domain.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace AgentCore.Infrastructure.Services;

public class WorkflowBackgroundService(
    IWorkflowQueue queue,
    IServiceScopeFactory scopeFactory,
    ILogger<WorkflowBackgroundService> logger) : BackgroundService
{
    private readonly IWorkflowQueue _queue = queue;
    private readonly IServiceScopeFactory _scopeFactory = scopeFactory;
    private readonly ILogger<WorkflowBackgroundService> _logger = logger;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Workflow Background Service is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var workflowId = await _queue.DequeueAsync(stoppingToken);

                await ProcessWorkflowAsync(workflowId, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                // Prevent throwing if stoppingToken was signaled
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred executing workflow background task.");
            }
        }

        _logger.LogInformation("Workflow Background Service is stopping.");
    }

    private async Task ProcessWorkflowAsync(Guid workflowId, CancellationToken stoppingToken)
    {
        _logger.LogInformation("Processing workflow {WorkflowId}", workflowId);

        using var scope = _scopeFactory.CreateScope();
        var orchestrator = scope.ServiceProvider.GetRequiredService<IOrchestratorService>();

        try
        {
            await orchestrator.ProcessWorkflowAsync(workflowId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing workflow {WorkflowId} in background service", workflowId);
        }
    }
}
