namespace PersonalAssistantAgent.Models
{
    /// <summary>
    /// Encapsulates the result of analyzing a user-provided description for flow automation.
    /// </summary>
    public sealed class AnalysisResult
    {
        public string Intent { get; set; } = string.Empty;
        public FlowTemplate? SuggestedTemplate { get; set; }
    }
}