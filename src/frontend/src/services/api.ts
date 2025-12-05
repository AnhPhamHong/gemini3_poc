import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
    GenerateTopicsRequest,
    GenerateTopicsResponse,
    Workflow,
    CreateWorkflowRequest,
    ApproveOutlineRequest,
    RejectOutlineRequest,
    ReviseDraftRequest,
    ChatRequest,
    PublishRequest,
    PagedWorkflowsResponse,
    WorkflowListParams,
} from '@/types';

export const blogAgentApi = createApi({
    reducerPath: 'blogAgentApi',
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5128/api',
        prepareHeaders: (headers) => {
            headers.set('Content-Type', 'application/json');
            return headers;
        },
    }),
    tagTypes: ['Topics', 'Workflow'],
    endpoints: (builder) => ({
        // Generate topic ideas
        generateTopics: builder.mutation<GenerateTopicsResponse, GenerateTopicsRequest>({
            query: (request) => ({
                url: '/topics/generate',
                method: 'POST',
                body: request,
            }),
            invalidatesTags: ['Topics'],
        }),

        // Create a new workflow
        createWorkflow: builder.mutation<Workflow, CreateWorkflowRequest>({
            query: (request) => ({
                url: '/workflows',
                method: 'POST',
                body: request,
            }),
            invalidatesTags: ['Workflow'],
        }),

        // Get workflow state
        getWorkflow: builder.query<Workflow, string>({
            query: (id) => `/workflows/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Workflow', id }],
        }),

        // Get all workflows
        getWorkflows: builder.query<PagedWorkflowsResponse, WorkflowListParams | void>({
            query: (params) => {
                if (!params) return '/workflows';

                const queryParams = new URLSearchParams();
                if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber.toString());
                if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
                if (params.sortBy) queryParams.append('sortBy', params.sortBy);
                if (params.sortDescending !== undefined) queryParams.append('sortDescending', params.sortDescending.toString());
                if (params.filterByState) queryParams.append('filterByState', params.filterByState);

                return `/workflows?${queryParams.toString()}`;
            },
            providesTags: ['Workflow'],
        }),

        // Approve outline
        approveOutline: builder.mutation<Workflow, ApproveOutlineRequest>({
            query: ({ workflowId, ...body }) => ({
                url: `/workflows/${workflowId}/approve-outline`,
                method: 'POST',
                body,
            }),
            invalidatesTags: (_result, _error, { workflowId }) => [{ type: 'Workflow', id: workflowId }],
        }),

        // Reject outline
        rejectOutline: builder.mutation<Workflow, RejectOutlineRequest>({
            query: ({ workflowId, ...body }) => ({
                url: `/workflows/${workflowId}/reject-outline`,
                method: 'POST',
                body,
            }),
            invalidatesTags: (_result, _error, { workflowId }) => [{ type: 'Workflow', id: workflowId }],
        }),

        // Revise draft
        reviseDraft: builder.mutation<Workflow, ReviseDraftRequest>({
            query: ({ workflowId, ...body }) => ({
                url: `/workflows/${workflowId}/revise`,
                method: 'POST',
                body,
            }),
            invalidatesTags: (_result, _error, { workflowId }) => [{ type: 'Workflow', id: workflowId }],
        }),

        // Chat with agent
        chatWithAgent: builder.mutation<void, ChatRequest>({
            query: ({ workflowId, ...body }) => ({
                url: `/workflows/${workflowId}/chat`,
                method: 'POST',
                body,
            }),
        }),

        // Publish to CMS
        publishToCMS: builder.mutation<void, PublishRequest>({
            query: ({ platform, ...body }) => ({
                url: `/publish/${platform}`,
                method: 'POST',
                body,
            }),
        }),

        // Apply SEO suggestions
        applySeoSuggestions: builder.mutation<Workflow, string>({
            query: (workflowId) => ({
                url: `/workflows/${workflowId}/apply-seo`,
                method: 'POST',
            }),
            invalidatesTags: (_result, _error, workflowId) => [{ type: 'Workflow', id: workflowId }],
        }),

        // Finalize workflow
        finalizeWorkflow: builder.mutation<Workflow, string>({
            query: (workflowId) => ({
                url: `/workflows/${workflowId}/finalize`,
                method: 'POST',
            }),
            invalidatesTags: (_result, _error, workflowId) => [{ type: 'Workflow', id: workflowId }],
        }),
    }),
});

export const {
    useGenerateTopicsMutation,
    useCreateWorkflowMutation,
    useGetWorkflowQuery,
    useGetWorkflowsQuery,
    useApproveOutlineMutation,
    useRejectOutlineMutation,
    useReviseDraftMutation,
    useChatWithAgentMutation,
    usePublishToCMSMutation,
    useApplySeoSuggestionsMutation,
    useFinalizeWorkflowMutation,
} = blogAgentApi;
