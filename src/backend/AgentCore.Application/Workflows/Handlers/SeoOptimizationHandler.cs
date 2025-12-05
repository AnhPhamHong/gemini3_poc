using AgentCore.Application.Workflows.Commands;
using AgentCore.Domain.Interfaces;
using MediatR;

namespace AgentCore.Application.Workflows.Handlers;

public class SeoOptimizationHandler : 
    IRequestHandler<ApplySeoSuggestionsCommand, bool>,
    IRequestHandler<FinalizeWorkflowCommand, bool>,
    IRequestHandler<GenerateOptimizedContentCommand, string>
{
    private readonly IOrchestratorService _orchestrator;
    private readonly IGeminiClient _geminiClient;

    public SeoOptimizationHandler(IOrchestratorService orchestrator, IGeminiClient geminiClient)
    {
        _orchestrator = orchestrator;
        _geminiClient = geminiClient;
    }

    public async Task<bool> Handle(ApplySeoSuggestionsCommand request, CancellationToken cancellationToken)
    {
        // Logic to apply suggestions will be implemented in OrchestratorService
        // This handler acts as a bridge if we want to move logic here later, 
        // but for now we'll delegate to Orchestrator to keep state management centralized.
        // Actually, let's implement the Gemini call here to keep Orchestrator clean?
        // No, Orchestrator manages state transitions. Let's add a method to Orchestrator.
        return await _orchestrator.ApplySeoSuggestionsAsync(request.WorkflowId);
    }

    public async Task<bool> Handle(FinalizeWorkflowCommand request, CancellationToken cancellationToken)
    {
        return await _orchestrator.FinalizeWorkflowAsync(request.WorkflowId);
    }

    public async Task<string> Handle(GenerateOptimizedContentCommand request, CancellationToken cancellationToken)
    {
        var suggestions = string.Join("\n- ", request.SeoData.Suggestions);
        var prompt = $@"You are an expert SEO copywriter. Rewrite the following blog post content to improve its SEO based on the provided suggestions.

Original Content:
{request.Content}

SEO Suggestions:
- {suggestions}

Keywords to target: {string.Join(", ", request.SeoData.Keywords)}

Please provide the rewritten content only. Do not include any explanations or markdown code blocks unless the content itself requires them.";

        var response = await _geminiClient.GenerateContentAsync(prompt);
        return response;
    }
}
