using AgentCore.Application.Commands;
using AgentCore.Application.Interfaces;
using AgentCore.Application.Services;
using AgentCore.Domain.Entities;
using AgentCore.Domain.Enums;
using AgentCore.Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace AgentCore.Tests.Services;

public class OrchestratorServiceTests
{
    private readonly Mock<IMediator> _mediatorMock;
    private readonly Mock<IWorkflowRepository> _repositoryMock;
    private readonly Mock<IWorkflowNotificationService> _notificationServiceMock;
    private readonly Mock<IWorkflowQueue> _queueMock;
    private readonly OrchestratorService _service;

    public OrchestratorServiceTests()
    {
        _mediatorMock = new Mock<IMediator>();
        _repositoryMock = new Mock<IWorkflowRepository>();
        _notificationServiceMock = new Mock<IWorkflowNotificationService>();
        _queueMock = new Mock<IWorkflowQueue>();
        _service = new OrchestratorService(_mediatorMock.Object, _repositoryMock.Object, _notificationServiceMock.Object, _queueMock.Object, Mock.Of<ILogger<OrchestratorService>>());
    }

    [Fact]
    public async Task StartWorkflowAsync_ShouldCreateAndSaveWorkflow()
    {
        // Arrange
        var topic = "Test Topic";

        // Act
        var result = await _service.StartWorkflowAsync(topic);

        // Assert
        Assert.NotEqual(Guid.Empty, result);
        _repositoryMock.Verify(r => r.SaveAsync(It.Is<Workflow>(w => w.Topic == topic && w.State == WorkflowState.Idle)), Times.Once);
        _queueMock.Verify(q => q.QueueBackgroundWorkItemAsync(result, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ProcessWorkflowAsync_Idle_ShouldTransitionToResearching()
    {
        // Arrange
        var workflow = new Workflow("Test Topic");
        _repositoryMock.Setup(r => r.GetAsync(workflow.Id)).ReturnsAsync(workflow);

        // Act
        await _service.ProcessWorkflowAsync(workflow.Id, 1);

        // Assert
        Assert.Equal(WorkflowState.Researching, workflow.State);
        _repositoryMock.Verify(r => r.SaveAsync(workflow), Times.Once);
    }

    [Fact]
    public async Task ProcessWorkflowAsync_Researching_ShouldCallMediatorAndTransitionToOutlining()
    {
        // Arrange
        var workflow = new Workflow("Test Topic");
        workflow.TransitionTo(WorkflowState.Researching);
        _repositoryMock.Setup(r => r.GetAsync(workflow.Id)).ReturnsAsync(workflow);
        _mediatorMock.Setup(m => m.Send(It.IsAny<ResearchCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("Research Data");

        // Act
        await _service.ProcessWorkflowAsync(workflow.Id, 1);

        // Assert
        Assert.Equal(WorkflowState.Outlining, workflow.State);
        Assert.Equal("Research Data", workflow.ResearchData);
        _repositoryMock.Verify(r => r.SaveAsync(workflow), Times.Once);
    }

    [Fact]
    public async Task ProcessWorkflowAsync_Outlining_ShouldCallMediatorAndTransitionToWaitingApproval()
    {
        // Arrange
        var workflow = new Workflow("Test Topic");
        workflow.UpdateResearch("Research Data");
        workflow.TransitionTo(WorkflowState.Outlining);
        _repositoryMock.Setup(r => r.GetAsync(workflow.Id)).ReturnsAsync(workflow);
        _mediatorMock.Setup(m => m.Send(It.IsAny<GenerateOutlineCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("Outline Data");

        // Act
        await _service.ProcessWorkflowAsync(workflow.Id, 1);

        // Assert
        Assert.Equal(WorkflowState.WaitingApproval, workflow.State);
        Assert.Equal("Outline Data", workflow.Outline);
        _repositoryMock.Verify(r => r.SaveAsync(workflow), Times.Once);
    }

    [Fact]
    public async Task ProcessWorkflowAsync_WaitingApproval_ShouldTransitionToDrafting()
    {
        // Arrange
        var workflow = new Workflow("Test Topic");
        workflow.TransitionTo(WorkflowState.WaitingApproval);
        _repositoryMock.Setup(r => r.GetAsync(workflow.Id)).ReturnsAsync(workflow);

        // Act
        await _service.ProcessWorkflowAsync(workflow.Id, 1);

        // Assert
        Assert.Equal(WorkflowState.WaitingApproval, workflow.State);
        _repositoryMock.Verify(r => r.SaveAsync(workflow), Times.Once);
    }

    [Fact]
    public async Task ProcessWorkflowAsync_Drafting_ShouldCallMediatorAndTransitionToEditing()
    {
        // Arrange
        var workflow = new Workflow("Test Topic");
        workflow.SetOutline("Outline Data");
        workflow.TransitionTo(WorkflowState.Drafting);
        _repositoryMock.Setup(r => r.GetAsync(workflow.Id)).ReturnsAsync(workflow);
        _mediatorMock.Setup(m => m.Send(It.IsAny<GenerateDraftCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("Draft Content");

        // Act
        await _service.ProcessWorkflowAsync(workflow.Id, 1);

        // Assert
        Assert.Equal(WorkflowState.Editing, workflow.State);
        Assert.Equal("Draft Content", workflow.DraftContent);
        _repositoryMock.Verify(r => r.SaveAsync(workflow), Times.Once);
    }

    [Fact]
    public async Task ProcessWorkflowAsync_Editing_ShouldCallMediatorAndTransitionToOptimizing()
    {
        // Arrange
        var workflow = new Workflow("Test Topic");
        workflow.SetDraft("Draft Content");
        workflow.TransitionTo(WorkflowState.Editing);
        _repositoryMock.Setup(r => r.GetAsync(workflow.Id)).ReturnsAsync(workflow);
        _mediatorMock.Setup(m => m.Send(It.IsAny<EditContentCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("Edited Content");

        // Act
        await _service.ProcessWorkflowAsync(workflow.Id, 1);

        // Assert
        Assert.Equal(WorkflowState.Optimizing, workflow.State);
        Assert.Equal("Edited Content", workflow.DraftContent);
        _repositoryMock.Verify(r => r.SaveAsync(workflow), Times.Once);
    }

    [Fact]
    public async Task ProcessWorkflowAsync_Optimizing_ShouldCallMediatorAndTransitionToFinal()
    {
        // Arrange
        var workflow = new Workflow("Test Topic");
        workflow.SetDraft("Edited Content");
        workflow.TransitionTo(WorkflowState.Optimizing);
        _repositoryMock.Setup(r => r.GetAsync(workflow.Id)).ReturnsAsync(workflow);
        _mediatorMock.Setup(m => m.Send(It.IsAny<AnalyzeSeoCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("SEO Result");

        // Act
        await _service.ProcessWorkflowAsync(workflow.Id, 1);

        // Assert
        Assert.Equal(WorkflowState.Final, workflow.State);
        _repositoryMock.Verify(r => r.SaveAsync(workflow), Times.Once);
    }
    [Fact]
    public async Task ProcessWorkflowAsync_Exception_ShouldTransitionToFailed()
    {
        // Arrange
        var workflow = new Workflow("Test Topic");
        workflow.TransitionTo(WorkflowState.Researching);
        _repositoryMock.Setup(r => r.GetAsync(workflow.Id)).ReturnsAsync(workflow);
        
        // Setup mediator to throw exception
        _mediatorMock.Setup(m => m.Send(It.IsAny<ResearchCommand>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("API Failure"));

        // Act
        await _service.ProcessWorkflowAsync(workflow.Id, 1);

        // Assert
        Assert.Equal(WorkflowState.Failed, workflow.State);
        _repositoryMock.Verify(r => r.SaveAsync(workflow), Times.AtLeastOnce);
    }
}
