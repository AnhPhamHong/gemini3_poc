namespace AgentCore.Application.Interfaces;

public interface IWorkflowQueue
{
    ValueTask QueueBackgroundWorkItemAsync(Guid workflowId, CancellationToken cancellationToken = default);
    ValueTask<Guid> DequeueAsync(CancellationToken cancellationToken);
}
