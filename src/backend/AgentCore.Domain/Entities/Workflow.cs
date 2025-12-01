using AgentCore.Domain.Enums;

namespace AgentCore.Domain.Entities;

public class Workflow
{
    public Guid Id { get; private set; }
    public string Topic { get; private set; }
    public WorkflowState State { get; private set; }
    public string? ResearchData { get; private set; }
    public string? Outline { get; private set; }
    public string? DraftContent { get; private set; }
    public string? Tone { get; private set; }
    public string? Feedback { get; private set; }
    public List<ChatMessage> ChatHistory { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    public Workflow(string topic, string? tone = null)
    {
        Id = Guid.NewGuid();
        Topic = topic;
        State = WorkflowState.Idle;
        Tone = tone;
        ChatHistory = new List<ChatMessage>();
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    // Private constructor for EF Core
    private Workflow()
    {
        Topic = string.Empty;
        ChatHistory = new List<ChatMessage>();
    }

    public void TransitionTo(WorkflowState newState)
    {
        // Add validation logic here if needed
        State = newState;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateResearch(string data)
    {
        ResearchData = data;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetOutline(string outline)
    {
        Outline = outline;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetDraft(string draft)
    {
        DraftContent = draft;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetFeedback(string feedback)
    {
        Feedback = feedback;
        UpdatedAt = DateTime.UtcNow;
    }

    public void AddChatMessage(string role, string message)
    {
        ChatHistory.Add(new ChatMessage { Role = role, Content = message, Timestamp = DateTime.UtcNow });
        UpdatedAt = DateTime.UtcNow;
    }
}

public class ChatMessage
{
    public string Role { get; set; } = string.Empty; // "user" or "assistant"
    public string Content { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}

