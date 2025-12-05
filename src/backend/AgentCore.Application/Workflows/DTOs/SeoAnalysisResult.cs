namespace AgentCore.Application.Workflows.DTOs;

public class SeoAnalysisResult
{
    public List<string> Keywords { get; set; } = new();
    public string MetaTitle { get; set; } = string.Empty;
    public string MetaDescription { get; set; } = string.Empty;
    public int Score { get; set; }
    public List<string> Suggestions { get; set; } = new();
}
