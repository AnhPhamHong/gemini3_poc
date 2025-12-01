using AgentCore.Domain.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace AgentCore.Api.Hubs;

public class WorkflowHub : Hub
{
    private readonly ILogger<WorkflowHub> _logger;

    public WorkflowHub(ILogger<WorkflowHub> logger)
    {
        _logger = logger;
    }

    public async Task JoinWorkflowGroup(string workflowId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"workflow-{workflowId}");
        _logger.LogInformation("Client {ConnectionId} joined workflow group {WorkflowId}", 
            Context.ConnectionId, workflowId);
    }

    public async Task LeaveWorkflowGroup(string workflowId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"workflow-{workflowId}");
        _logger.LogInformation("Client {ConnectionId} left workflow group {WorkflowId}", 
            Context.ConnectionId, workflowId);
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Client connected: {ConnectionId}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Client disconnected: {ConnectionId}", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}
