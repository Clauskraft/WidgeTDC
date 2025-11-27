/**
 * WidgeTDC Browser Extension - Content Script
 * Captures page content and enables AI assistance
 */

interface PageContent {
    url: string;
    title: string;
    text: string;
    metadata: {
        author?: string;
        publishedDate?: string;
        description?: string;
    };
    selectedText?: string;
}

class WidgeTDCAssistant {
    private apiUrl: string = 'http://localhost:3000/api';
    private sidebar: HTMLElement | null = null;

    constructor() {
        this.init();
    }

    private async init() {
        // Listen for messages from background script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sendResponse);
            return true; // Keep channel open for async response
        });

        // Add context menu handler
        document.addEventListener('mouseup', this.handleTextSelection.bind(this));
    }

    /**
     * Handle messages from background script
     */
    private async handleMessage(message: any, sendResponse: Function) {
        switch (message.action) {
            case 'captureContent':
                const content = this.capturePageContent();
                await this.sendToBackend('/memory/ingest', content);
                sendResponse({ success: true, content });
                break;

            case 'searchSimilar':
                const results = await this.searchSimilar(message.query);
                sendResponse({ success: true, results });
                break;

            case 'toggleSidebar':
                this.toggleSidebar();
                sendResponse({ success: true });
                break;

            case 'askQuestion':
                const answer = await this.askQuestion(message.question);
                sendResponse({ success: true, answer });
                break;

            default:
                sendResponse({ success: false, error: 'Unknown action' });
        }
    }

    /**
     * Capture page content
     */
    private capturePageContent(): PageContent {
        // Extract main content (remove scripts, styles, etc.)
        const clone = document.cloneNode(true) as Document;
        const scripts = clone.querySelectorAll('script, style, noscript');
        scripts.forEach(el => el.remove());

        // Get text content
        const text = clone.body.innerText.trim();

        // Extract metadata
        const metadata: PageContent['metadata'] = {
            author: this.getMetaContent('author'),
            publishedDate: this.getMetaContent('article:published_time'),
            description: this.getMetaContent('description'),
        };

        return {
            url: window.location.href,
            title: document.title,
            text: text.substring(0, 10000), // Limit to 10k chars
            metadata,
        };
    }

    /**
     * Get meta tag content
     */
    private getMetaContent(name: string): string | undefined {
        const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
        return meta?.getAttribute('content') || undefined;
    }

    /**
     * Handle text selection
     */
    private handleTextSelection(event: MouseEvent) {
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();

        if (selectedText && selectedText.length > 10) {
            // Show floating action button
            this.showFloatingButton(event.clientX, event.clientY, selectedText);
        }
    }

    /**
     * Show floating action button
     */
    private showFloatingButton(x: number, y: number, text: string) {
        // Remove existing button
        const existing = document.getElementById('widgetdc-floating-btn');
        if (existing) existing.remove();

        // Create button
        const button = document.createElement('div');
        button.id = 'widgetdc-floating-btn';
        button.className = 'widgetdc-floating-button';
        button.innerHTML = `
      <button class="widgetdc-btn" data-action="save">💾 Save</button>
      <button class="widgetdc-btn" data-action="search">🔍 Search Similar</button>
      <button class="widgetdc-btn" data-action="ask">❓ Ask AI</button>
    `;
        button.style.position = 'fixed';
        button.style.left = `${x}px`;
        button.style.top = `${y + 10}px`;
        button.style.zIndex = '10000';

        // Add event listeners
        button.querySelectorAll('.widgetdc-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const action = (e.target as HTMLElement).getAttribute('data-action');
                await this.handleAction(action!, text);
                button.remove();
            });
        });

        document.body.appendChild(button);

        // Remove on click outside
        setTimeout(() => {
            document.addEventListener('click', () => button.remove(), { once: true });
        }, 100);
    }

    /**
     * Handle floating button action
     */
    private async handleAction(action: string, text: string) {
        switch (action) {
            case 'save':
                await this.saveText(text);
                this.showNotification('Text saved to WidgeTDC');
                break;

            case 'search':
                const results = await this.searchSimilar(text);
                this.showSidebarWithResults(results);
                break;

            case 'ask':
                const answer = await this.askQuestion(text);
                this.showSidebarWithAnswer(answer);
                break;
        }
    }

    /**
     * Save text to backend
     */
    private async saveText(text: string) {
        await this.sendToBackend('/memory/ingest', {
            content: text,
            source: 'browser_selection',
            url: window.location.href,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Search for similar content
     */
    private async searchSimilar(query: string): Promise<any[]> {
        const response = await this.sendToBackend('/search', { query, limit: 5 });
        return response.results || [];
    }

    /**
     * Ask AI a question
     */
    private async askQuestion(question: string): Promise<string> {
        const response = await this.sendToBackend('/query', { question });
        return response.answer || 'No answer available';
    }

    /**
     * Send data to backend
     */
    private async sendToBackend(endpoint: string, data: any): Promise<any> {
        try {
            const response = await fetch(`${this.apiUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('WidgeTDC API error:', error);
            return { error: String(error) };
        }
    }

    /**
     * Toggle sidebar
     */
    private toggleSidebar() {
        if (this.sidebar) {
            this.sidebar.remove();
            this.sidebar = null;
        } else {
            this.createSidebar();
        }
    }

    /**
     * Create sidebar
     */
    private createSidebar() {
        const sidebar = document.createElement('div');
        sidebar.id = 'widgetdc-sidebar';
        sidebar.className = 'widgetdc-sidebar';
        sidebar.innerHTML = `
      <div class="widgetdc-sidebar-header">
        <h3>WidgeTDC Assistant</h3>
        <button class="widgetdc-close">×</button>
      </div>
      <div class="widgetdc-sidebar-content">
        <p>Loading...</p>
      </div>
    `;

        sidebar.querySelector('.widgetdc-close')?.addEventListener('click', () => {
            this.toggleSidebar();
        });

        document.body.appendChild(sidebar);
        this.sidebar = sidebar;
    }

    /**
     * Show sidebar with search results
     */
    private showSidebarWithResults(results: any[]) {
        this.createSidebar();
        const content = this.sidebar?.querySelector('.widgetdc-sidebar-content');
        if (content) {
            content.innerHTML = `
        <h4>Similar Content</h4>
        ${results.map(r => `
          <div class="widgetdc-result">
            <h5>${r.title || 'Untitled'}</h5>
            <p>${r.content?.substring(0, 200)}...</p>
            <small>${r.source || 'Unknown source'}</small>
          </div>
        `).join('')}
      `;
        }
    }

    /**
     * Show sidebar with AI answer
     */
    private showSidebarWithAnswer(answer: string) {
        this.createSidebar();
        const content = this.sidebar?.querySelector('.widgetdc-sidebar-content');
        if (content) {
            content.innerHTML = `
        <h4>AI Answer</h4>
        <div class="widgetdc-answer">${answer}</div>
      `;
        }
    }

    /**
     * Show notification
     */
    private showNotification(message: string) {
        const notification = document.createElement('div');
        notification.className = 'widgetdc-notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => notification.remove(), 3000);
    }
}

// Initialize assistant
new WidgeTDCAssistant();
