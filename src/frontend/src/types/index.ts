// Topic related types
export interface TopicSuggestion {
    id: string;
    title: string;
    description: string;
    estimatedWordCount: number;
    keywords: string[];
    tone: ToneType;
}

export type ToneType = 'professional' | 'casual' | 'witty' | 'persuasive';

// Workflow related types
export interface Workflow {
    id: string;
    topic: string;
    state: WorkflowState;
    currentStep: string; // Human readable status
    data: {
        research?: string; // Changed to string to match backend DTO
        outline?: string;
        draft?: Draft;
        // Edited Draft Storage - Solution 1
        originalDraft?: string;
        editedDraft?: string;
        editChanges?: string[];
    };
    createdAt: string;
    updatedAt: string;
}

export type WorkflowState = 'Idle' | 'Researching' | 'Outlining' | 'WaitingApproval' | 'Drafting' | 'Review' | 'Editing' | 'Optimizing' | 'Final' | 'Failed';

export interface ResearchData {
    // Define structure based on what backend returns, for now generic
    [key: string]: any;
}

// Draft related types
export interface Draft {
    id: string;
    workflowId: string;
    content: string;
    metaTitle: string;
    metaDescription: string;
    seoScore: number;
    lastUpdated: string;
}



// User Settings
export interface UserSettings {
    defaultTone: string;
    apiKey: string;
    cmsIntegrations: CMSIntegration[];
}

export interface CMSIntegration {
    platform: 'wordpress' | 'medium' | 'ghost';
    siteUrl: string;
    credentials: Record<string, string>;
    autoPublish: boolean;
}

// API request/response types
export interface GenerateTopicsRequest {
    keywords: string;
    tone: ToneType;
    targetWordCount?: number;
}

export interface GenerateTopicsResponse {
    topics: TopicSuggestion[];
}

export interface CreateWorkflowRequest {
    topic: string;
    tone?: string;
}

export interface ApproveOutlineRequest {
    workflowId: string;
    notes?: string;
}

export interface RejectOutlineRequest {
    workflowId: string;
    feedback: string;
}

export interface ReviseDraftRequest {
    workflowId: string;
    instructions: string;
}

export interface ChatRequest {
    workflowId: string;
    message: string;
}

export interface PublishRequest {
    workflowId: string;
    platform: string;
}
