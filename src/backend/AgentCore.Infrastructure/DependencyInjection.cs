using AgentCore.Domain.Interfaces;
using AgentCore.Infrastructure.External;
using AgentCore.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AgentCore.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AgentCoreDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection"), o => o.UseVector()));

        services.AddScoped<IWorkflowRepository, WorkflowRepository>();
        services.AddScoped<IGeminiClient, GeminiClient>();
        
        return services;
    }
}
