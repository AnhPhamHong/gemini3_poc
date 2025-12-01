using AgentCore.Application.Commands;
using AgentCore.Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace AgentCore.Application.Handlers;

public class ResearchHandler : IRequestHandler<ResearchCommand, string>
{
    private readonly IGeminiClient _geminiClient;
    private readonly ILogger<ResearchHandler> _logger;

    public ResearchHandler(IGeminiClient geminiClient, ILogger<ResearchHandler> logger)
    {
        _geminiClient = geminiClient;
        _logger = logger;
    }

    public async Task<string> Handle(ResearchCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Researching topic: {Topic}", request.Topic);

        var prompt = $@"You are an expert researcher.
Topic: {request.Topic}

Please provide a comprehensive research summary for this topic. Include:
1. Key facts and statistics
2. Current trends and developments
3. Common questions or pain points
4. Target audience analysis
5. Potential angles for a blog post

Format the output as clear, readable Markdown.";

        try
        {
            var research = await _geminiClient.GenerateContentAsync(prompt);
            _logger.LogInformation("Successfully generated research for topic: {Topic}", request.Topic);
            return research;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error researching topic: {Topic}", request.Topic);
            throw;
        }
    }
}
