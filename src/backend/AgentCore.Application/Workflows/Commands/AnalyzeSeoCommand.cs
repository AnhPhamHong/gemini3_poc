using AgentCore.Application.Workflows.DTOs;
using MediatR;

namespace AgentCore.Application.Workflows.Commands;

public record AnalyzeSeoCommand(Guid WorkflowId, string Content, string Topic) : IRequest<SeoAnalysisResult>;
