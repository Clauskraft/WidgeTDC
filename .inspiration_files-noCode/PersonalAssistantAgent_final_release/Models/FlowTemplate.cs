namespace PersonalAssistantAgent.Models
{
    /// <summary>
    /// Represents a named flow template with a short description.
    /// </summary>
    public sealed class FlowTemplate
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}