using AgentCore.Application.Services;
using AgentCore.Domain.Interfaces;
using AgentCore.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddScoped<IOrchestratorService, OrchestratorService>();
builder.Services.AddScoped<AgentCore.Domain.Interfaces.IWorkflowNotificationService, AgentCore.Api.Services.WorkflowNotificationService>();
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(OrchestratorService).Assembly));

// Add SignalR
builder.Services.AddSignalR();

// Add controllers
builder.Services.AddControllers();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173") // Vite default port
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Add API Explorer and OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");
app.UseRouting(); // Important: UseRouting must come before UseEndpoints

app.UseAuthorization();

app.MapControllers();

app.UseEndpoints(endpoints =>
{
    endpoints.MapHub<AgentCore.Api.Hubs.WorkflowHub>("/hubs/workflow");
    // ... other endpoints (e.g., MapControllers, MapRazorPages)
});

app.Run();
