using AgentCore.Domain.Interfaces;
using Google.GenAI;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AgentCore.Infrastructure.External;

public class GeminiClient : IGeminiClient
{
    private readonly Client _client;
    private readonly ILogger<GeminiClient> _logger;
    private readonly string _model;

    public GeminiClient(IConfiguration configuration, ILogger<GeminiClient> logger)
    {
        _logger = logger;
        
        var apiKey = configuration["Gemini:ApiKey"] ?? throw new ArgumentNullException("Gemini:ApiKey is missing");
        _model = configuration["Gemini:Model"] ?? "gemini-2.0-flash";
        
        _client = new Client(apiKey: apiKey);
    }

    public async Task<string> GenerateContentAsync(string prompt)
    {
        try
        {
            var response = await _client.Models.GenerateContentAsync(
                model: _model,
                contents: prompt
            );
            
            return response?.Candidates?[0]?.Content?.Parts?[0]?.Text ?? string.Empty;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating content from Gemini API");
            throw;
        }
    }
}
