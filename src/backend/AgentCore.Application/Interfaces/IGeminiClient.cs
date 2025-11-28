namespace AgentCore.Application.Interfaces;

public interface IGeminiClient
{
    Task<string> GenerateContentAsync(string prompt);
    Task<float[]> GenerateEmbeddingAsync(string text);
}
