using System.Threading.Channels;
using AgentCore.Application.Interfaces;

namespace AgentCore.Infrastructure.Services;

public class WorkflowQueue : IWorkflowQueue
{
    private readonly Channel<Guid> _queue;

    public WorkflowQueue()
    {
        // Unbounded channel for simplicity, but could be bounded for backpressure
        _queue = Channel.CreateUnbounded<Guid>();
    }

    public async ValueTask QueueBackgroundWorkItemAsync(Guid workflowId, CancellationToken cancellationToken = default)
    {
        if (workflowId == Guid.Empty)
        {
            throw new ArgumentNullException(nameof(workflowId));
        }

        await _queue.Writer.WriteAsync(workflowId, cancellationToken);
    }

    public async ValueTask<Guid> DequeueAsync(CancellationToken cancellationToken)
    {
        return await _queue.Reader.ReadAsync(cancellationToken);
    }
}
