using AgentCore.Application.Workflows.DTOs;
using MediatR;

namespace AgentCore.Application.Workflows.Commands;

public record GenerateOptimizedContentCommand(string Content, SeoAnalysisResult SeoData) : IRequest<string>;
