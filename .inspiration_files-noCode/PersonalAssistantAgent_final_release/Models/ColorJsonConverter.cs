using System;
using System.Drawing;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace PersonalAssistantAgent.Models
{
    /// <summary>
    /// System.Text.Json converter that serializes and deserializes System.Drawing.Color as ARGB integers.
    /// </summary>
    public sealed class ColorJsonConverter : JsonConverter<Color>
    {
        public override Color Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            return Color.FromArgb(reader.GetInt32());
        }

        public override void Write(Utf8JsonWriter writer, Color value, JsonSerializerOptions options)
        {
            writer.WriteNumberValue(value.ToArgb());
        }
    }
}