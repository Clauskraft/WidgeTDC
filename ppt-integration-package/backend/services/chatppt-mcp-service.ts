// ChatPPT-MCP Service - Enterprise PPT Generation
// Integration with YOOTeam ChatPPT MCP Server

export class ChatPPTMCPService {
  private mcpUrl: string;
  private apiKey: string;

  constructor() {
    this.mcpUrl = process.env.CHATPPT_API_URL || 'https://api.yoo-ai.com/mcp';
    this.apiKey = process.env.CHATPPT_API_KEY || '';
  }

  /**
   * Generate PPT from theme and requirements
   */
  async generateFromTheme(theme: string, requirements: string): Promise<string> {
    const response = await fetch(`${this.mcpUrl}/generate-ppt`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        theme,
        requirements,
        language: 'en',
        style: 'professional'
      })
    });

    if (!response.ok) {
      throw new Error(`PPT generation failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.ppt_url; // Returns online editable URL
  }

  /**
   * Generate PPT from uploaded document
   */
  async generateFromDocument(documentBuffer: Buffer, filename: string): Promise<string> {
    const formData = new FormData();
    formData.append('document', new Blob([documentBuffer]), filename);
    formData.append('settings', JSON.stringify({
      extractImages: true,
      preserveFormatting: true,
      slidesPerSection: 2
    }));

    const response = await fetch(`${this.mcpUrl}/document-to-ppt`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Document conversion failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.ppt_url;
  }

  /**
   * Apply professional template
   */
  async applyTemplate(pptUrl: string, templateId: string): Promise<string> {
    const response = await fetch(`${this.mcpUrl}/apply-template`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ppt_url: pptUrl, template_id: templateId })
    });

    const result = await response.json();
    return result.updated_ppt_url;
  }

  /**
   * Change color scheme
   */
  async changeColorScheme(pptUrl: string, colors: ColorScheme): Promise<string> {
    const response = await fetch(`${this.mcpUrl}/change-colors`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ppt_url: pptUrl, colors })
    });

    const result = await response.json();
    return result.updated_ppt_url;
  }
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}
