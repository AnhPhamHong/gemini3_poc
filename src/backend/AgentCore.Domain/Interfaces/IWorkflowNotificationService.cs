using AgentCore.Domain.Entities;

namespace AgentCore.Domain.Interfaces;

public interface IWorkflowNotificationService
{
    Task NotifyWorkflowUpdatedAsync(Guid workflowId, Workflow workflow);
}
