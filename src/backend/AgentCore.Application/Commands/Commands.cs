using MediatR;

namespace AgentCore.Application.Commands;

public record ResearchCommand(string Topic) : IRequest<string>;
public record GenerateOutlineCommand(string Topic, string ResearchData) : IRequest<string>;
public record GenerateDraftCommand(string Topic, string Outline) : IRequest<string>;
public record EditContentCommand(string DraftContent, string TargetTone = "Professional") : IRequest<EditedContent>;


// Support types for commands
public record EditedContent(string Content, List<string> Changes);

// Workflow Management Commands
public record StartWorkflowCommand(string Topic, string? Tone) : IRequest<Guid>;
public record ApproveOutlineCommand(Guid WorkflowId, string? Notes) : IRequest<bool>;
public record RejectOutlineCommand(Guid WorkflowId, string Feedback) : IRequest<bool>;
public record ReviseDraftCommand(Guid WorkflowId, string Instructions) : IRequest<bool>;
public record ChatCommand(Guid WorkflowId, string Message) : IRequest<string>;

// Topic Generation Commands
public record GenerateTopicsCommand(string Keywords, string Tone, int? TargetWordCount) : IRequest<List<AgentCore.Application.DTOs.TopicSuggestionDto>>;
