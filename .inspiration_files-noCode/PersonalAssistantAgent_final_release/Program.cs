using System;
using System.Windows.Forms;

namespace PersonalAssistantAgent
{
    internal static class Program
    {
        [STAThread]
        static void Main()
        {
            // Initialize application configuration (sets default high DPI mode, text rendering, etc.)
            ApplicationConfiguration.Initialize();

            // Run the main form of the application
            Application.Run(new UI.MainForm());
        }
    }
}