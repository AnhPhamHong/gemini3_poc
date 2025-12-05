using AgentCore.Domain.Interfaces;
using AgentCore.Application.Workflows.Commands;
using AgentCore.Application.Workflows.DTOs;
using MediatR;
using System.Text.Json;

namespace AgentCore.Application.Workflows.Handlers;

public class SeoHandler : IRequestHandler<AnalyzeSeoCommand, SeoAnalysisResult>
{
    private readonly IGeminiClient _geminiClient;

    public SeoHandler(IGeminiClient geminiClient)
    {
        _geminiClient = geminiClient;
    }

    public async Task<SeoAnalysisResult> Handle(AnalyzeSeoCommand request, CancellationToken cancellationToken)
    {
        var prompt = $@"
You are an expert SEO specialist. Analyze the following blog post content and provide SEO optimization data.

Topic: {request.Topic}

Content:
{request.Content}

Please provide the output in the following JSON format ONLY (no markdown formatting):
{{
    ""Keywords"": [""keyword1"", ""keyword2"", ...],
    ""MetaTitle"": ""SEO optimized title"",
    ""MetaDescription"": ""SEO optimized description"",
    ""Score"": 85,
    ""Suggestions"": [""suggestion1"", ""suggestion2"", ...]
}}
";

        var response = await _geminiClient.GenerateContentAsync(prompt);
        var json = response.Trim();
        
        // Remove markdown code blocks if present
        if (json.StartsWith("```json"))
        {
            json = json.Substring(7);
            if (json.EndsWith("```"))
            {
                json = json.Substring(0, json.Length - 3);
            }
        }
        else if (json.StartsWith("```"))
        {
             json = json.Substring(3);
            if (json.EndsWith("```"))
            {
                json = json.Substring(0, json.Length - 3);
            }
        }

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        try 
        {
            return JsonSerializer.Deserialize<SeoAnalysisResult>(json, options) ?? new SeoAnalysisResult();
        }
        catch (JsonException)
        {
            // Fallback if JSON parsing fails
            return new SeoAnalysisResult 
            { 
                Suggestions = new List<string> { "Failed to parse SEO analysis result." } 
            };
        }
    }
}
