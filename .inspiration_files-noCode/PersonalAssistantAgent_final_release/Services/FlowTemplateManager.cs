using System.Collections.Generic;
using System.Linq;
using PersonalAssistantAgent.Models;

#nullable enable

namespace PersonalAssistantAgent.Services
{
    /// <summary>
    /// Manages a collection of flow templates and performs simple intent analysis on user descriptions.
    /// </summary>
    public sealed class FlowTemplateManager
    {
        private readonly List<FlowTemplate> _templates = new();

        /// <summary>
        /// Adds a new template to the internal list.
        /// </summary>
        public void AddTemplate(FlowTemplate template) => _templates.Add(template);

        /// <summary>
        /// Returns all templates.
        /// </summary>
        public IEnumerable<FlowTemplate> All() => _templates;

        /// <summary>
        /// Analyzes the provided description and input file to determine a likely intent
        /// and suggest an appropriate template. If a file path is provided, its extension
        /// influences the choice. Otherwise the description alone is used.
        /// </summary>
        /// <param name="description">User-provided textual description of the automation.</param>
        /// <param name="filePath">Path to the input file (may be null or empty).</param>
        /// <returns>An AnalysisResult containing inferred intent and a matching template.</returns>
        public AnalysisResult AnalyzeDescription(string description, string? filePath = null)
        {
            var desc = description?.ToLowerInvariant() ?? string.Empty;
            string ext = string.Empty;
            if (!string.IsNullOrWhiteSpace(filePath))
            {
                try
                {
                    ext = System.IO.Path.GetExtension(filePath)?.ToLowerInvariant() ?? string.Empty;
                }
                catch
                {
                    // ignore path errors
                }
            }
            // Determine intent based on file extension first
            if (!string.IsNullOrEmpty(ext))
            {
                if (ext == ".csv" || ext == ".tsv" || ext == ".txt")
                {
                    return new AnalysisResult
                    {
                        Intent = "Data file processing",
                        SuggestedTemplate = _templates.FirstOrDefault(t => t.Name.Contains("CSV") || t.Name.Contains("Data Processor"))
                    };
                }
                if (ext == ".xlsx" || ext == ".xls")
                {
                    return new AnalysisResult
                    {
                        Intent = "Excel processing",
                        SuggestedTemplate = _templates.FirstOrDefault(t => t.Name.Contains("Excel"))
                    };
                }
                if (ext == ".pdf")
                {
                    return new AnalysisResult
                    {
                        Intent = "PDF monitoring",
                        SuggestedTemplate = _templates.FirstOrDefault(t => t.Name.Contains("File Monitor"))
                    };
                }
                if (ext == ".doc" || ext == ".docx")
                {
                    return new AnalysisResult
                    {
                        Intent = "Document processing",
                        SuggestedTemplate = _templates.FirstOrDefault(t => t.Name.Contains("Word") || t.Name.Contains("Document"))
                    };
                }
            }
            // Fall back to description-based analysis
            if (desc.Contains("csv") || desc.Contains("excel"))
            {
                return new AnalysisResult
                {
                    Intent = "Data file processing",
                    SuggestedTemplate = _templates.FirstOrDefault(t => t.Name.Contains("CSV") || t.Name.Contains("Data Processor"))
                };
            }
            if (desc.Contains("email") && desc.Contains("file"))
            {
                return new AnalysisResult
                {
                    Intent = "File Notification",
                    SuggestedTemplate = _templates.FirstOrDefault(t => t.Name.Contains("File Monitor"))
                };
            }
            return new AnalysisResult { Intent = "General" };
        }
    }
}