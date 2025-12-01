using AgentCore.Domain.Entities;

namespace AgentCore.Domain.Interfaces;

public interface IOrchestratorService
{
    Task<Guid> StartWorkflowAsync(string topic, string? tone = null);
    Task ProcessWorkflowAsync(Guid workflowId, int maxIterations = 10);
    Task<Workflow?> GetWorkflowAsync(Guid workflowId);
    Task<bool> ApproveOutlineAsync(Guid workflowId, string? notes);
    Task<bool> RejectOutlineAsync(Guid workflowId, string feedback);
    Task<bool> ReviseDraftAsync(Guid workflowId, string instructions);
    Task<string> ProcessChatMessageAsync(Guid workflowId, string message);
}
