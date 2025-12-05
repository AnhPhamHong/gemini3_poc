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
    
    // Edited Draft Storage - Solution 1
    public string? OriginalDraft { get; private set; }
    public string? EditedDraft { get; private set; }
    public string? EditChanges { get; private set; }  // JSON array of changes
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
        OriginalDraft = draft;      // Store as original for editing phase
        DraftContent = draft;       // Keep for backward compatibility
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

    public string? SeoData { get; private set; } // JSON storage for SEO results

    public void SetEditedDraft(string editedContent, List<string> changes)
    {
        EditedDraft = editedContent;
        EditChanges = System.Text.Json.JsonSerializer.Serialize(changes);
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetSeoData(string seoData)
    {
        SeoData = seoData;
        UpdatedAt = DateTime.UtcNow;
    }

    public List<string>? GetEditChanges()
    {
        if (string.IsNullOrEmpty(EditChanges)) return null;
        return System.Text.Json.JsonSerializer.Deserialize<List<string>>(EditChanges);
    }
}

public class ChatMessage
{
    public string Role { get; set; } = string.Empty; // "user" or "assistant"
    public string Content { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}

