using AgentCore.Domain.Enums;

namespace AgentCore.Application.DTOs;

public class WorkflowDto
{
    public Guid Id { get; set; }
    public string Topic { get; set; } = string.Empty;
    public string? Tone { get; set; }
    public string State { get; set; } = string.Empty;
    public string CurrentStep { get; set; } = string.Empty;
    public WorkflowDataDto Data { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class WorkflowDataDto
{
    public string? Research { get; set; }
    public string? Outline { get; set; }
    public DraftDto? Draft { get; set; }
    
    // Edited Draft Storage - Solution 1
    public string? OriginalDraft { get; set; }
    public string? EditedDraft { get; set; }
    public List<string>? EditChanges { get; set; }
    public AgentCore.Application.Workflows.DTOs.SeoAnalysisResult? SeoData { get; set; }
}



public class DraftDto
{
    public string Content { get; set; } = string.Empty;
    public string MetaTitle { get; set; } = string.Empty;
    public string MetaDescription { get; set; } = string.Empty;
    public int SeoScore { get; set; }
}

// Request DTOs
public class CreateWorkflowRequest
{
    public string Topic { get; set; } = string.Empty;
    public string? Tone { get; set; }
}

public class ApproveOutlineRequest
{
    public string? Notes { get; set; }
}

public class RejectOutlineRequest
{
    public string Feedback { get; set; } = string.Empty;
}

public class ReviseDraftRequest
{
    public string Instructions { get; set; } = string.Empty;
}

public class ChatRequest
{
    public string Message { get; set; } = string.Empty;
}
