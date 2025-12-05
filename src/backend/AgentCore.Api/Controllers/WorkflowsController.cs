using AgentCore.Application.Commands;
using AgentCore.Application.DTOs;
using AgentCore.Application.Queries;
using AgentCore.Application.Workflows.Commands;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace AgentCore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkflowsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<WorkflowsController> _logger;

    public WorkflowsController(IMediator mediator, ILogger<WorkflowsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// List all workflows with pagination support
    /// </summary>
    /// <param name="pageNumber">Page number (1-indexed), default: 1</param>
    /// <param name="pageSize">Items per page (1-100), default: 10</param>
    /// <param name="sortBy">Field to sort by (CreatedAt, UpdatedAt, Topic), default: CreatedAt</param>
    /// <param name="sortDescending">Sort in descending order, default: true</param>
    /// <param name="filterByState">Filter by workflow state (optional)</param>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<WorkflowDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PagedResult<WorkflowDto>>> ListWorkflows(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? sortBy = "CreatedAt",
        [FromQuery] bool sortDescending = true,
        [FromQuery] string? filterByState = null)
    {
        // Validate query parameters
        if (pageNumber < 1)
        {
            return BadRequest("Page number must be greater than 0");
        }

        if (pageSize < 1 || pageSize > 100)
        {
            return BadRequest("Page size must be between 1 and 100");
        }

        // Validate sortBy field
        var validSortFields = new[] { "CreatedAt", "UpdatedAt", "Topic" };
        if (sortBy != null && !validSortFields.Contains(sortBy, StringComparer.OrdinalIgnoreCase))
        {
            return BadRequest($"Invalid sort field. Valid values are: {string.Join(", ", validSortFields)}");
        }

        try
        {
            var query = new ListWorkflowsQuery
            {
                PageNumber = pageNumber,
                PageSize = pageSize,
                SortBy = sortBy,
                SortDescending = sortDescending,
                FilterByState = filterByState
            };

            var result = await _mediator.Send(query);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid pagination parameters");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing workflows with pagination");
            return StatusCode(500, "An error occurred while listing workflows");
        }
    }


    /// <summary>
    /// Start a new blog generation workflow
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(WorkflowDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<WorkflowDto>> CreateWorkflow([FromBody] CreateWorkflowRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Topic))
        {
            return BadRequest("Topic is required");
        }

        try
        {
            var workflowId = await _mediator.Send(new StartWorkflowCommand(request.Topic, request.Tone));
            
            // Fetch the created workflow to return
            var workflow = await _mediator.Send(new GetWorkflowQuery(workflowId));
            
            return CreatedAtAction(nameof(GetWorkflow), new { id = workflowId }, workflow);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating workflow for topic: {Topic}", request.Topic);
            return StatusCode(500, "An error occurred while creating the workflow");
        }
    }

    /// <summary>
    /// Get the current state of a workflow
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(WorkflowDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WorkflowDto>> GetWorkflow(Guid id)
    {
        try
        {
            var workflow = await _mediator.Send(new GetWorkflowQuery(id));
            return Ok(workflow);
        }
        catch (KeyNotFoundException)
        {
            return NotFound($"Workflow {id} not found");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving workflow: {WorkflowId}", id);
            return StatusCode(500, "An error occurred while retrieving the workflow");
        }
    }

    /// <summary>
    /// Approve the generated outline and proceed to drafting
    /// </summary>
    [HttpPost("{id}/approve-outline")]
    [ProducesResponseType(typeof(WorkflowDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WorkflowDto>> ApproveOutline(Guid id, [FromBody] ApproveOutlineRequest request)
    {
        try
        {
            var success = await _mediator.Send(new ApproveOutlineCommand(id, request.Notes));
            
            if (!success)
            {
                return BadRequest("Cannot approve outline. Workflow may not be in WaitingApproval state.");
            }

            var workflow = await _mediator.Send(new GetWorkflowQuery(id));
            return Ok(workflow);
        }
        catch (KeyNotFoundException)
        {
            return NotFound($"Workflow {id} not found");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error approving outline for workflow: {WorkflowId}", id);
            return StatusCode(500, "An error occurred while approving the outline");
        }
    }

    /// <summary>
    /// Reject the generated outline and request regeneration
    /// </summary>
    [HttpPost("{id}/reject-outline")]
    [ProducesResponseType(typeof(WorkflowDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WorkflowDto>> RejectOutline(Guid id, [FromBody] RejectOutlineRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Feedback))
        {
            return BadRequest("Feedback is required when rejecting an outline");
        }

        try
        {
            var success = await _mediator.Send(new RejectOutlineCommand(id, request.Feedback));
            
            if (!success)
            {
                return BadRequest("Cannot reject outline. Workflow may not be in WaitingApproval state.");
            }

            var workflow = await _mediator.Send(new GetWorkflowQuery(id));
            return Ok(workflow);
        }
        catch (KeyNotFoundException)
        {
            return NotFound($"Workflow {id} not found");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error rejecting outline for workflow: {WorkflowId}", id);
            return StatusCode(500, "An error occurred while rejecting the outline");
        }
    }

    /// <summary>
    /// Request revisions to the current draft
    /// </summary>
    [HttpPost("{id}/revise")]
    [ProducesResponseType(typeof(WorkflowDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WorkflowDto>> ReviseDraft(Guid id, [FromBody] ReviseDraftRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Instructions))
        {
            return BadRequest("Revision instructions are required");
        }

        try
        {
            var success = await _mediator.Send(new ReviseDraftCommand(id, request.Instructions));
            
            if (!success)
            {
                return BadRequest("Cannot revise draft. Workflow may not exist.");
            }

            var workflow = await _mediator.Send(new GetWorkflowQuery(id));
            return Ok(workflow);
        }
        catch (KeyNotFoundException)
        {
            return NotFound($"Workflow {id} not found");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error revising draft for workflow: {WorkflowId}", id);
            return StatusCode(500, "An error occurred while revising the draft");
        }
    }

    /// <summary>
    /// Send a chat message to the agent in the context of this workflow
    /// </summary>
    [HttpPost("{id}/chat")]
    [ProducesResponseType(typeof(ChatResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ChatResponse>> Chat(Guid id, [FromBody] ChatRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest("Message is required");
        }

        try
        {
            var response = await _mediator.Send(new ChatCommand(id, request.Message));
            
            return Ok(new ChatResponse { Message = response });
        }
        catch (ArgumentException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing chat message for workflow: {WorkflowId}", id);
            return StatusCode(500, "An error occurred while processing the chat message");
        }
    }
    /// <summary>
    /// Apply SEO suggestions to the content
    /// </summary>
    [HttpPost("{id}/apply-seo")]
    [ProducesResponseType(typeof(WorkflowDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WorkflowDto>> ApplySeoSuggestions(Guid id)
    {
        try
        {
            var success = await _mediator.Send(new ApplySeoSuggestionsCommand(id));
            
            if (!success)
            {
                return BadRequest("Cannot apply SEO suggestions. Workflow may not be in Optimizing state or SEO data is missing.");
            }

            var workflow = await _mediator.Send(new GetWorkflowQuery(id));
            return Ok(workflow);
        }
        catch (KeyNotFoundException)
        {
            return NotFound($"Workflow {id} not found");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error applying SEO suggestions for workflow: {WorkflowId}", id);
            return StatusCode(500, "An error occurred while applying SEO suggestions");
        }
    }

    /// <summary>
    /// Finalize the workflow without applying SEO suggestions
    /// </summary>
    [HttpPost("{id}/finalize")]
    [ProducesResponseType(typeof(WorkflowDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WorkflowDto>> FinalizeWorkflow(Guid id)
    {
        try
        {
            var success = await _mediator.Send(new FinalizeWorkflowCommand(id));
            
            if (!success)
            {
                return BadRequest("Cannot finalize workflow. Workflow may not be in Optimizing state.");
            }

            var workflow = await _mediator.Send(new GetWorkflowQuery(id));
            return Ok(workflow);
        }
        catch (KeyNotFoundException)
        {
            return NotFound($"Workflow {id} not found");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finalizing workflow: {WorkflowId}", id);
            return StatusCode(500, "An error occurred while finalizing the workflow");
        }
    }
}

public class ChatResponse
{
    public string Message { get; set; } = string.Empty;
}
