using MediatR;

namespace AgentCore.Application.Workflows.Commands;

public record ApplySeoSuggestionsCommand(Guid WorkflowId) : IRequest<bool>;
