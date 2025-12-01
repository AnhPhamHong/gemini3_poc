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
    topicId: string;
    state: WorkflowState;
    currentStep: string; // Human readable status
    data: {
        research?: ResearchData;
        outline?: string;
        draft?: Draft;
    };
    createdAt: string;
    updatedAt: string;
}

export type WorkflowState = 'Researching' | 'Outlining' | 'WaitingApproval' | 'Drafting' | 'Review' | 'Optimizing' | 'Completed' | 'Failed';

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
