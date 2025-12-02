/**
 * Harvest Tool - "The Control Stick"
 *
 * The interface through which The Architect commands the Harvester arm.
 * This tool exposes the harvesting capability to the MCP system.
 *
 * Commands:
 * - harvest.fetch: Reach out and grab content from a URL
 * - harvest.list: Show all harvested knowledge
 * - harvest.read: Read a specific harvested file
 */
import { harvesterService } from '../../services/harvester/HarvesterService.js';
import { hyperLog } from '../../services/hyper-log.js';
// Tool definitions for MCP registry
export const harvestToolDefinitions = [
    {
        name: 'harvest.fetch',
        description: 'Reach out and harvest raw content from a URL. Stores in the knowledge base. Use category to organize into library.',
        inputSchema: {
            type: 'object',
            properties: {
                url: {
                    type: 'string',
                    description: 'The URL to harvest content from (supports raw GitHub, Gists, etc.)'
                },
                filename: {
                    type: 'string',
                    description: 'Optional custom filename for the harvested content (e.g., "claude_thinking_logic")'
                },
                category: {
                    type: 'string',
                    description: 'Optional category for organizing in library (e.g., "system_prompt", "architecture", "reference")'
                }
            },
            required: ['url']
        }
    },
    {
        name: 'harvest.list',
        description: 'List all harvested knowledge files in the knowledge base.',
        inputSchema: {
            type: 'object',
            properties: {
                category: {
                    type: 'string',
                    description: 'Optional: filter by category (e.g., "system_prompt")'
                }
            }
        }
    },
    {
        name: 'harvest.read',
        description: 'Read the content of a harvested knowledge file.',
        inputSchema: {
            type: 'object',
            properties: {
                filename: {
                    type: 'string',
                    description: 'The filename of the harvested content to read (can include path like "library/system_prompt/file.txt")'
                },
                category: {
                    type: 'string',
                    description: 'Optional: the category folder to look in'
                }
            },
            required: ['filename']
        }
    }
];
/**
 * Handler: harvest.fetch
 * The arm reaches out and grasps knowledge from the void
 */
export async function harvestFetchHandler(payload, ctx) {
    const { url, filename, category } = payload;
    if (!url) {
        return {
            success: false,
            error: 'URL is required. What knowledge shall I reach for?'
        };
    }
    await hyperLog.log('USER_INTENT', 'TheArchitect', `Commanded to harvest: ${url}${category ? ` -> library/${category}` : ''}`, {
        url,
        filename,
        category,
        requestedBy: ctx.userId
    });
    const result = await harvesterService.harvestFromUrl(url, { filename, category });
    if (result.success) {
        await hyperLog.log('INSIGHT', 'TheArchitect', `New knowledge acquired: ${result.category ? `library/${result.category}/` : ''}${result.filename}`, {
            source: url,
            size: result.size,
            category: result.category
        });
    }
    return result;
}
/**
 * Handler: harvest.list
 * Survey the harvested knowledge
 */
export async function harvestListHandler(payload, _ctx) {
    const { category } = payload || {};
    const result = await harvesterService.listHarvested(category);
    return {
        success: true,
        files: result.files,
        count: result.files.length,
        location: result.location,
        libraryPath: harvesterService.getLibraryPath()
    };
}
/**
 * Handler: harvest.read
 * Recall harvested knowledge
 */
export async function harvestReadHandler(payload, _ctx) {
    const { filename, category } = payload;
    if (!filename) {
        return {
            success: false,
            error: 'Filename is required. Which knowledge shall I recall?'
        };
    }
    const result = await harvesterService.readHarvested(filename, category);
    if (!result) {
        return {
            success: false,
            error: `Knowledge not found: ${filename}`
        };
    }
    // For large files, include a preview
    const preview = result.content.length > 2000
        ? result.content.substring(0, 2000) + '\n\n... [truncated, use full content for analysis]'
        : undefined;
    return {
        success: true,
        content: result.content,
        metadata: result.metadata,
        preview
    };
}
