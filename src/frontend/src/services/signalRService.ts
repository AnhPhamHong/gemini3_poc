import * as signalR from '@microsoft/signalr';

class SignalRService {
    private connection: signalR.HubConnection | null = null;
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    private isConnecting = false;

    async initialize() {
        if (this.connection || this.isConnecting) {
            return this.connection;
        }

        this.isConnecting = true;

        try {
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5128/api';
            const hubUrl = apiBaseUrl.replace('/api', '') + '/hubs/workflow';

            this.connection = new signalR.HubConnectionBuilder()
                .withUrl(hubUrl, {
                    skipNegotiation: false,
                    transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling
                })
                .withAutomaticReconnect({
                    nextRetryDelayInMilliseconds: (retryContext: signalR.RetryContext) => {
                        // Exponential backoff: 0s, 2s, 10s, 30s
                        if (retryContext.previousRetryCount === 0) return 0;
                        if (retryContext.previousRetryCount === 1) return 2000;
                        if (retryContext.previousRetryCount === 2) return 10000;
                        return 30000;
                    }
                })
                .configureLogging(signalR.LogLevel.Information)
                .build();

            // Set up connection event handlers
            this.connection.onreconnecting((error?: Error) => {
                console.warn('SignalR reconnecting...', error);
            });

            this.connection.onreconnected((connectionId?: string) => {
                console.log('SignalR reconnected:', connectionId);
            });

            this.connection.onclose((error?: Error) => {
                console.error('SignalR connection closed', error);
                this.scheduleReconnect();
            });

            await this.connection.start();
            console.log('SignalR connected successfully');

            this.isConnecting = false;
            return this.connection;
        } catch (error) {
            console.error('Failed to start SignalR connection:', error);
            this.isConnecting = false;
            this.scheduleReconnect();
            throw error;
        }
    }

    private scheduleReconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }

        this.reconnectTimeout = setTimeout(async () => {
            console.log('Attempting to reconnect SignalR...');
            try {
                await this.initialize();
            } catch (error) {
                console.error('Reconnection attempt failed:', error);
            }
        }, 5000);
    }

    async joinWorkflowGroup(workflowId: string) {
        const connection = await this.getConnection();
        if (connection) {
            await connection.invoke('JoinWorkflowGroup', workflowId);
            console.log(`Joined workflow group: ${workflowId}`);
        }
    }

    async leaveWorkflowGroup(workflowId: string) {
        const connection = await this.getConnection();
        if (connection) {
            await connection.invoke('LeaveWorkflowGroup', workflowId);
            console.log(`Left workflow group: ${workflowId}`);
        }
    }

    async getConnection(): Promise<signalR.HubConnection | null> {
        if (!this.connection || this.connection.state === signalR.HubConnectionState.Disconnected) {
            await this.initialize();
        }
        return this.connection;
    }

    async disconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.connection) {
            await this.connection.stop();
            this.connection = null;
            console.log('SignalR disconnected');
        }
    }

    onWorkflowUpdated(callback: (workflow: any) => void) {
        // Register callback immediately on the connection
        // The connection should already be initialized by the time this is called
        if (this.connection) {
            this.connection.on('WorkflowUpdated', callback);
            console.log('Registered WorkflowUpdated handler');
        } else {
            console.warn('SignalR connection not available when registering WorkflowUpdated handler');
        }
    }

    offWorkflowUpdated(callback: (workflow: any) => void) {
        if (this.connection) {
            this.connection.off('WorkflowUpdated', callback);
        }
    }

    getConnectionState(): signalR.HubConnectionState | null {
        return this.connection?.state ?? null;
    }
}

// Export singleton instance
export const signalRService = new SignalRService();
export default signalRService;
