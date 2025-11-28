using System;
using System.Drawing;
using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace PersonalAssistantAgent.Models
{
    /// <summary>
    /// User configuration persisted between sessions.
    /// </summary>
    public sealed class AppSettings
    {
        public string CompanyName { get; set; } = string.Empty;
        public Color PrimaryColor { get; set; } = Color.FromArgb(0, 120, 212);
        public string DefaultModel { get; set; } = "GPT-4o (Recommended)";

        private static readonly string SettingsPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "PersonalAssistantAgent", "settings.json");

        public static AppSettings Load()
        {
            try
            {
                if (!File.Exists(SettingsPath)) return new AppSettings();
                var json = File.ReadAllText(SettingsPath);
                return JsonSerializer.Deserialize<AppSettings>(json, new JsonSerializerOptions
                {
                    Converters = { new ColorJsonConverter() }
                }) ?? new AppSettings();
            }
            catch
            {
                // If parsing fails, return default settings
                return new AppSettings();
            }
        }

        public void Save()
        {
            try
            {
                var dir = Path.GetDirectoryName(SettingsPath);
                if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
                {
                    Directory.CreateDirectory(dir);
                }
                var json = JsonSerializer.Serialize(this, new JsonSerializerOptions
                {
                    WriteIndented = true,
                    Converters = { new ColorJsonConverter() }
                });
                File.WriteAllText(SettingsPath, json);
            }
            catch
            {
                // Do not throw exceptions from a settings save
            }
        }
    }
}