using MediatR;

namespace AgentCore.Application.Workflows.Commands;

public record FinalizeWorkflowCommand(Guid WorkflowId) : IRequest<bool>;
