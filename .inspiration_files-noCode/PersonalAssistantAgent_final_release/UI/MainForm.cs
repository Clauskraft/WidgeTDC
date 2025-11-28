using System;
using System.Drawing;
using System.Windows.Forms;
using PersonalAssistantAgent.Models;
using PersonalAssistantAgent.Services;
using System.Linq;
using System.Collections.Generic;

#nullable enable

namespace PersonalAssistantAgent.UI
{
    /// <summary>
    /// Main entry form for the Personal Assistant agent. It contains two functional areas: one
    /// for automating tasks via Power Automate (as implemented in the original agent), and
    /// another for managing code packages produced by large language models. The form uses
    /// a tabbed interface for switching between the two domains while sharing a common
    /// header, configuration area and status bar.
    /// </summary>
    public sealed class MainForm : Form
    {
        // Services/state
        private readonly FlowTemplateManager _templateManager = new();
        private readonly CodeManager _codeManager = new();
        private readonly AppSettings _settings = AppSettings.Load();

        // Header controls
        private Panel _headerPanel = null!;
        private Label _titleLabel = null!;
        private FlowLayoutPanel _headerButtons = null!;
        private Button _btnSettings = null!;
        private Button _btnLogin = null!;

        // Configuration controls
        private Panel _configPanel = null!;
        private ComboBox _cmbModel = null!;
        private TextBox _txtFilePath = null!;
        private Button _btnBrowseFile = null!;
        private Button _btnAnalyzeFile = null!;
        private Label _lblDataInfo = null!;

        // Tab control
        private TabControl _tabControl = null!;
        private TabPage _tabAutomate = null!;
        private TabPage _tabCode = null!;

        // Automate page controls
        private SplitContainer _autoSplit = null!;
        private TextBox _autoDesc = null!;
        private ComboBox _autoTemplate = null!;
        private TextBox _autoResult = null!;
        private ListView _autoFlows = null!;
        private ToolStripStatusLabel _modelStatus = null!;

        // Custom templates and schedules
        private readonly List<FlowTemplate> _customTemplates = new();
        private readonly List<(FlowTemplate Template, System.Windows.Forms.Timer Timer)> _scheduled = new();

        // Code manager page controls
        private TextBox _codeSourcePath = null!;
        private Button _codeBrowseBtn = null!;
        private ComboBox _codeVersionBump = null!;
        private ComboBox _codePublishKind = null!;
        private Button _codeAnalyzeBtn = null!;
        private Button _codeBuildBtn = null!;
        private Button _codeRollbackBtn = null!;
        private TextBox _codeResult = null!;

        // Status bar
        private StatusStrip _statusStrip = null!;
        private ToolStripStatusLabel _statusLabel = null!;

        public MainForm()
        {
            SuspendLayout();
            AutoScaleMode = AutoScaleMode.Dpi;
            Font = SystemFonts.MessageBoxFont;
            Text = "Personal Assistant Agent";
            StartPosition = FormStartPosition.CenterScreen;
            MinimumSize = new Size(1100, 750);
            BackColor = Color.White;

            BuildHeader();
            BuildConfig();
            BuildTabControl();
            BuildStatus();

            // Root layout: header, config, tab control, status bar
            var root = new TableLayoutPanel
            {
                Dock = DockStyle.Fill,
                ColumnCount = 1,
                RowCount = 4,
                AutoSize = true
            };
            root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
            root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
            root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
            root.RowStyles.Add(new RowStyle(SizeType.AutoSize));

            root.Controls.Add(_headerPanel, 0, 0);
            root.Controls.Add(_configPanel, 0, 1);
            root.Controls.Add(_tabControl, 0, 2);
            root.Controls.Add(_statusStrip, 0, 3);
            Controls.Add(root);

            // Populate data and finish
            LoadTemplates();
            ApplyBranding();
            LoadDefaultSettings();
            ResumeLayout();

            // Set splitter distance when automate tab is shown
            this.Shown += (_, __) =>
            {
                // Only set if the automate tab is active and the split exists
                if (_autoSplit != null && _tabControl.SelectedTab == _tabAutomate)
                {
                    int w = _autoSplit.ClientSize.Width;
                    if (w > 0)
                    {
                        _autoSplit.SplitterDistance = (int)(w * 0.62);
                    }
                }
            };

            // Update splitter on tab selection
            _tabControl.SelectedIndexChanged += (_, __) =>
            {
                if (_tabControl.SelectedTab == _tabAutomate && _autoSplit != null)
                {
                    int w = _autoSplit.ClientSize.Width;
                    if (w > 0)
                    {
                        _autoSplit.SplitterDistance = (int)(w * 0.62);
                    }
                }
            };
        }

        private void BuildHeader()
        {
            _headerPanel = new Panel { Dock = DockStyle.Top, Padding = new Padding(16) };
            var grid = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 2, AutoSize = true };
            grid.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 70));
            grid.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 30));

            _titleLabel = new Label
            {
                Text = "Personal Assistant Agent",
                AutoSize = true,
                Font = new Font("Segoe UI", 18, FontStyle.Bold),
                ForeColor = Color.White
            };

            _headerButtons = new FlowLayoutPanel
            {
                FlowDirection = FlowDirection.RightToLeft,
                Dock = DockStyle.Fill,
                AutoSize = true,
                WrapContents = false
            };
            _btnSettings = new Button { Text = "⚙ Settings", AutoSize = true, FlatStyle = FlatStyle.Flat };
            _btnSettings.Click += SettingsButton_Click;
            _btnLogin = new Button { Text = "Login", AutoSize = true, FlatStyle = FlatStyle.Flat };
            _btnLogin.Click += LoginButton_Click;
            _headerButtons.Controls.Add(_btnSettings);
            _headerButtons.Controls.Add(_btnLogin);

            grid.Controls.Add(_titleLabel, 0, 0);
            grid.Controls.Add(_headerButtons, 1, 0);
            _headerPanel.Controls.Add(grid);
        }

        private void BuildConfig()
        {
            _configPanel = new Panel { Dock = DockStyle.Top, Padding = new Padding(16), AutoSize = true };
            var tl = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, AutoSize = true };

            // Model selection
            var modelRow = new TableLayoutPanel { Dock = DockStyle.Top, ColumnCount = 2, AutoSize = true };
            modelRow.ColumnStyles.Add(new ColumnStyle(SizeType.AutoSize));
            modelRow.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
            var lblModel = new Label { Text = "AI Model:", AutoSize = true, TextAlign = ContentAlignment.MiddleLeft };
            _cmbModel = new ComboBox { Name = "modelComboBox", Dock = DockStyle.Fill, DropDownStyle = ComboBoxStyle.DropDownList };
            _cmbModel.Items.AddRange(new object[] { "GPT-4o (Recommended)", "GPT-4o-mini (Fast)", "Claude 3.5 Sonnet", "Claude 3 Haiku (Budget)", "Gemini Pro", "Local Llama (Privacy)" });
            _cmbModel.SelectedIndexChanged += (_, __) => _modelStatus.Text = $"Model: {_cmbModel.SelectedItem}";
            modelRow.Controls.Add(lblModel, 0, 0);
            modelRow.Controls.Add(_cmbModel, 1, 0);

            // CSV input row (PowerAutomate data source)
            var fileRow = new TableLayoutPanel { Dock = DockStyle.Top, ColumnCount = 3, AutoSize = true };
            fileRow.ColumnStyles.Add(new ColumnStyle(SizeType.AutoSize));
            fileRow.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
            fileRow.ColumnStyles.Add(new ColumnStyle(SizeType.AutoSize));
            var lblDs = new Label { Text = "Data File:", AutoSize = true };
            _txtFilePath = new TextBox { ReadOnly = true, Dock = DockStyle.Fill, PlaceholderText = "No file selected" };
            _btnBrowseFile = new Button { Text = "📁 Browse File", AutoSize = true, FlatStyle = FlatStyle.Flat };
            _btnBrowseFile.Click += BrowseFileButton_Click;
            // File analysis button is optional; disabled initially
            _btnAnalyzeFile = new Button { Text = "🔍 Analyze File", AutoSize = true, FlatStyle = FlatStyle.Flat, Enabled = false };
            _btnAnalyzeFile.Click += AnalyzeFileButton_Click;
            fileRow.Controls.Add(lblDs, 0, 0);
            fileRow.Controls.Add(_txtFilePath, 1, 0);
            var fileBtnPanel = new FlowLayoutPanel { FlowDirection = FlowDirection.LeftToRight, AutoSize = true, WrapContents = false };
            fileBtnPanel.Controls.Add(_btnBrowseFile);
            fileBtnPanel.Controls.Add(_btnAnalyzeFile);
            fileRow.Controls.Add(fileBtnPanel, 2, 0);

            // Info label
            _lblDataInfo = new Label { AutoSize = true, ForeColor = Color.Gray, Text = "Upload a file to analyze and suggest flows" };

            tl.Controls.Add(modelRow);
            tl.Controls.Add(fileRow);
            tl.Controls.Add(_lblDataInfo);
            _configPanel.Controls.Add(tl);
        }

        private void BuildTabControl()
        {
            _tabControl = new TabControl { Dock = DockStyle.Fill };
            _tabAutomate = new TabPage("Power Automate");
            _tabCode = new TabPage("Code Manager");
            BuildAutomatePage();
            BuildCodePage();
            _tabControl.TabPages.Add(_tabAutomate);
            _tabControl.TabPages.Add(_tabCode);
        }

        private void BuildAutomatePage()
        {
            // Left: create new flow; Right: list flows
            _autoSplit = new SplitContainer
            {
                Dock = DockStyle.Fill,
                Orientation = Orientation.Vertical,
                SplitterWidth = 6
            };
            // Left group: Create New Flow
            var grpNew = new GroupBox { Text = "Create New Flow", Dock = DockStyle.Fill, Padding = new Padding(12) };
            var left = new TableLayoutPanel { Dock = DockStyle.Fill, RowCount = 5 };
            left.RowStyles.Add(new RowStyle(SizeType.AutoSize));
            left.RowStyles.Add(new RowStyle(SizeType.Percent, 50));
            left.RowStyles.Add(new RowStyle(SizeType.AutoSize));
            left.RowStyles.Add(new RowStyle(SizeType.AutoSize));
            left.RowStyles.Add(new RowStyle(SizeType.Percent, 50));

            var lblDesc = new Label { Text = "Describe what you want to automate:", AutoSize = true };
            _autoDesc = new TextBox { Multiline = true, Dock = DockStyle.Fill, ScrollBars = ScrollBars.Vertical };
            // Template selection row
            var tplRow = new TableLayoutPanel { Dock = DockStyle.Top, ColumnCount = 2, AutoSize = true };
            tplRow.ColumnStyles.Add(new ColumnStyle(SizeType.AutoSize));
            tplRow.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
            var lblTpl = new Label { Text = "OR Choose a Template:", AutoSize = true };
            _autoTemplate = new ComboBox { DropDownStyle = ComboBoxStyle.DropDownList, Dock = DockStyle.Fill };
            tplRow.Controls.Add(lblTpl, 0, 0);
            tplRow.Controls.Add(_autoTemplate, 1, 0);
            // Buttons row
            var btnRow = new FlowLayoutPanel { FlowDirection = FlowDirection.LeftToRight, Dock = DockStyle.Top, AutoSize = true, WrapContents = false };
            var btnAnalyzeDesc = new Button { Text = "🔍 Analyze", AutoSize = true, FlatStyle = FlatStyle.Flat };
            btnAnalyzeDesc.Click += (_, __) => AnalyzeDescription(_autoDesc.Text);
            var btnConfigure = new Button { Text = "⚙ Configure", AutoSize = true, FlatStyle = FlatStyle.Flat };
            var btnDeploy = new Button { Text = "🚀 Deploy", AutoSize = true, FlatStyle = FlatStyle.Flat };
            var btnSaveTemplate = new Button { Text = "💾 Save Template", AutoSize = true, FlatStyle = FlatStyle.Flat };
            btnSaveTemplate.Click += SaveTemplateButton_Click;
            var btnSchedule = new Button { Text = "⏰ Schedule", AutoSize = true, FlatStyle = FlatStyle.Flat };
            btnSchedule.Click += ScheduleButton_Click;
            btnRow.Controls.AddRange(new Control[] { btnAnalyzeDesc, btnConfigure, btnDeploy, btnSaveTemplate, btnSchedule });
            _autoResult = new TextBox { Multiline = true, ReadOnly = true, Dock = DockStyle.Fill, ScrollBars = ScrollBars.Vertical, Font = new Font("Consolas", 9) };
            left.Controls.Add(lblDesc, 0, 0);
            left.Controls.Add(_autoDesc, 0, 1);
            left.Controls.Add(tplRow, 0, 2);
            left.Controls.Add(btnRow, 0, 3);
            left.Controls.Add(_autoResult, 0, 4);
            grpNew.Controls.Add(left);
            _autoSplit.Panel1.Controls.Add(grpNew);

            // Right group: My Flows
            var grpFlows = new GroupBox { Text = "My Flows (Live Status)", Dock = DockStyle.Fill, Padding = new Padding(12) };
            _autoFlows = new ListView { Dock = DockStyle.Fill, View = View.Details, FullRowSelect = true, GridLines = true };
            _autoFlows.Columns.Add("Name", 140);
            _autoFlows.Columns.Add("Status", 80);
            _autoFlows.Columns.Add("Last Run", 120);
            _autoFlows.Columns.Add("Performance", 120);
            _autoFlows.Resize += (_, __) =>
            {
                int w = _autoFlows.ClientSize.Width;
                if (w > 0)
                {
                    _autoFlows.Columns[0].Width = (int)(w * 0.42);
                    _autoFlows.Columns[1].Width = (int)(w * 0.16);
                    _autoFlows.Columns[2].Width = (int)(w * 0.22);
                    _autoFlows.Columns[3].Width = (int)(w * 0.20);
                }
            };
            _autoFlows.Items.AddRange(new[]
            {
                new ListViewItem(new[] { "PDF Monitor", "Running", "2 min ago", "Fast" }),
                new ListViewItem(new[] { "Daily Reports", "Paused", "Yesterday", "Optimized" }),
                new ListViewItem(new[] { "Email Backup", "Failed", "1 hour ago", "Retry" }),
                new ListViewItem(new[] { "Teams Bot", "Running", "5 min ago", "Fastest" })
            });
            grpFlows.Controls.Add(_autoFlows);
            _autoSplit.Panel2.Controls.Add(grpFlows);

            _tabAutomate.Controls.Add(_autoSplit);
        }

        private void BuildCodePage()
        {
            // Build code management UI
            var grpCode = new GroupBox { Text = "Code Administration", Dock = DockStyle.Fill, Padding = new Padding(12) };
            var layout = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 2, RowCount = 6 };
            layout.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 150));
            layout.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 30)); // Source label
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 35)); // Source path + button
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 30)); // Version label
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 35)); // Version combo
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 30)); // Publish label
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 35)); // Publish combo
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 40)); // Buttons
            layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100)); // Result box

            // Source row
            var lblSource = new Label { Text = "Source package:", Anchor = AnchorStyles.Left, AutoSize = true };
            var srcPanel = new FlowLayoutPanel { FlowDirection = FlowDirection.LeftToRight, Dock = DockStyle.Fill, AutoSize = true, WrapContents = false };
            _codeSourcePath = new TextBox { ReadOnly = true, Width = 350, Anchor = AnchorStyles.Left }; // approximate width
            _codeBrowseBtn = new Button { Text = "📁 Browse", AutoSize = true, FlatStyle = FlatStyle.Flat };
            _codeBrowseBtn.Click += CodeBrowseButton_Click;
            srcPanel.Controls.Add(_codeSourcePath);
            srcPanel.Controls.Add(_codeBrowseBtn);
            layout.Controls.Add(lblSource, 0, 0);
            layout.Controls.Add(srcPanel, 1, 0);

            // Version bump
            var lblVersion = new Label { Text = "Version bump:", Anchor = AnchorStyles.Left, AutoSize = true };
            _codeVersionBump = new ComboBox { DropDownStyle = ComboBoxStyle.DropDownList, Anchor = AnchorStyles.Left };
            _codeVersionBump.Items.AddRange(new object[] { "None", "Patch", "Minor", "Major" });
            _codeVersionBump.SelectedIndex = 0;
            layout.Controls.Add(lblVersion, 0, 2);
            layout.Controls.Add(_codeVersionBump, 1, 2);

            // Publish kind
            var lblPublish = new Label { Text = "Publish kind:", Anchor = AnchorStyles.Left, AutoSize = true };
            _codePublishKind = new ComboBox { DropDownStyle = ComboBoxStyle.DropDownList, Anchor = AnchorStyles.Left };
            _codePublishKind.Items.AddRange(new object[] { "Local", "Exe", "Artifact", "NuGet" });
            _codePublishKind.SelectedIndex = 1; // Default to EXE
            layout.Controls.Add(lblPublish, 0, 4);
            layout.Controls.Add(_codePublishKind, 1, 4);

            // Action buttons
            var codeBtnRow = new FlowLayoutPanel { FlowDirection = FlowDirection.LeftToRight, AutoSize = true, Dock = DockStyle.Fill, WrapContents = false };
            _codeAnalyzeBtn = new Button { Text = "🔍 Analyze", AutoSize = true, FlatStyle = FlatStyle.Flat };
            _codeAnalyzeBtn.Click += (_, __) => _codeResult.Text = _codeManager.Analyze(_codeSourcePath.Text);
            _codeBuildBtn = new Button { Text = "🛠 Build/Publish", AutoSize = true, FlatStyle = FlatStyle.Flat };
            _codeBuildBtn.Click += async (_, __) =>
            {
                _codeBuildBtn.Enabled = false;
                _codeBuildBtn.Text = "Processing...";
                var result = await _codeManager.BuildAndPublishAsync(_codeSourcePath.Text, "net8.0-windows", "win-arm64", true, true);
                _codeResult.Text = result;
                _codeBuildBtn.Text = "🛠 Build/Publish";
                _codeBuildBtn.Enabled = true;
            };
            _codeRollbackBtn = new Button { Text = "↩ Rollback", AutoSize = true, FlatStyle = FlatStyle.Flat };
            _codeRollbackBtn.Enabled = false; // Not implemented
            codeBtnRow.Controls.AddRange(new Control[] { _codeAnalyzeBtn, _codeBuildBtn, _codeRollbackBtn });
            layout.Controls.Add(codeBtnRow, 1, 6);

            // Result box
            _codeResult = new TextBox { Multiline = true, ReadOnly = true, Dock = DockStyle.Fill, ScrollBars = ScrollBars.Vertical, Font = new Font("Consolas", 9) };
            layout.Controls.Add(new Label { Text = "", AutoSize = true }, 0, 7);
            layout.Controls.Add(_codeResult, 1, 7);

            grpCode.Controls.Add(layout);
            _tabCode.Controls.Add(grpCode);
        }

        private void BuildStatus()
        {
            _statusStrip = new StatusStrip { Dock = DockStyle.Bottom };
            _statusLabel = new ToolStripStatusLabel("Ready");
            var spring = new ToolStripStatusLabel { Spring = true };
            _modelStatus = new ToolStripStatusLabel("Model: Not Selected");
            _statusStrip.Items.Add(_statusLabel);
            _statusStrip.Items.Add(spring);
            _statusStrip.Items.Add(_modelStatus);
        }

        private void LoadTemplates()
        {
            _templateManager.AddTemplate(new FlowTemplate { Name = "📧 File Monitor → Email", Description = "Watch folder for new files." });
            _templateManager.AddTemplate(new FlowTemplate { Name = "📋 CSV Data Processor", Description = "Process rows in a CSV file." });
            foreach (var t in _templateManager.All())
            {
                _autoTemplate.Items.Add(t.Name);
            }
            // Add any custom templates created during runtime
            foreach (var ct in _customTemplates)
            {
                _autoTemplate.Items.Add(ct.Name);
            }
        }

        private void ApplyBranding()
        {
            // Apply company name and primary color
            Text = string.IsNullOrWhiteSpace(_settings.CompanyName) ? "Personal Assistant Agent" : $"PA Agent - {_settings.CompanyName}";
            _headerPanel.BackColor = _settings.PrimaryColor;
            _titleLabel.ForeColor = Color.White;
        }

        private void LoadDefaultSettings()
        {
            var idx = _cmbModel.Items.IndexOf(_settings.DefaultModel);
            _cmbModel.SelectedIndex = idx >= 0 ? idx : 0;
        }

        // Event handlers
        private void LoginButton_Click(object? sender, EventArgs e)
        {
            if (sender is not Button b) return;
            b.Enabled = false;
            b.Text = "Authenticating...";
            // Simulate auth delay
            var timer = new Timer { Interval = 1200 };
            timer.Tick += (_, __) =>
            {
                timer.Stop();
                b.Text = "Connected";
                b.Enabled = true;
            };
            timer.Start();
        }

        private void SettingsButton_Click(object? sender, EventArgs e)
        {
            using var dlg = new SettingsForm(_settings);
            if (dlg.ShowDialog(this) == DialogResult.OK)
            {
                _settings.Save();
                ApplyBranding();
                LoadDefaultSettings();
            }
        }

        private void AnalyzeDescription(string description)
        {
            // If both description and file are empty, prompt user
            if (string.IsNullOrWhiteSpace(description) && string.IsNullOrWhiteSpace(_txtFilePath.Text))
            {
                MessageBox.Show(this, "Please enter a description and/or select a data file.", "Info", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }
            // Determine file path if available
            string? path = string.IsNullOrWhiteSpace(_txtFilePath.Text) ? null : _txtFilePath.Text;
            var analysis = _templateManager.AnalyzeDescription(description, path);
            _autoResult.Text = $"Intent: {analysis.Intent}\r\nSuggested Template: {analysis.SuggestedTemplate?.Name ?? "None"}";
        }

        private void BrowseFileButton_Click(object? sender, EventArgs e)
        {
            using var ofd = new OpenFileDialog
            {
                Filter = "Supported files|*.csv;*.xlsx;*.xls;*.pdf;*.txt;*.doc;*.docx;*.json|All files|*.*",
                Title = "Select data file"
            };
            if (ofd.ShowDialog() == DialogResult.OK)
            {
                _txtFilePath.Text = ofd.FileName;
                _btnAnalyzeFile.Enabled = true;
                _lblDataInfo.Text = "File loaded.";
                _lblDataInfo.ForeColor = Color.DarkGreen;
            }
        }

        private void AnalyzeFileButton_Click(object? sender, EventArgs e)
        {
            if (string.IsNullOrEmpty(_txtFilePath.Text)) return;
            // Perform a lightweight analysis based on file type
            var analysis = _templateManager.AnalyzeDescription(string.Empty, _txtFilePath.Text);
            MessageBox.Show(this, $"File type analysis: {analysis.Intent}", "File Analysis", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        private void CodeBrowseButton_Click(object? sender, EventArgs e)
        {
            using var ofd = new OpenFileDialog { Filter = "ZIP files|*.zip|Solution/Project folders|*.csproj", Title = "Select source package or project" };
            // allow selecting directories: there is no direct directory selection here, but user can pick .csproj or .zip
            if (ofd.ShowDialog() == DialogResult.OK)
            {
                _codeSourcePath.Text = ofd.FileName;
            }
        }

        /// <summary>
        /// Save the current flow description and file path as a custom template.
        /// Prompts the user for a template name and adds it to the template list.
        /// </summary>
        private void SaveTemplateButton_Click(object? sender, EventArgs e)
        {
            // Ensure there is at least a description or a file
            if (string.IsNullOrWhiteSpace(_autoDesc.Text) && string.IsNullOrWhiteSpace(_txtFilePath.Text))
            {
                MessageBox.Show(this, "Please enter a description and/or select a data file before saving a template.", "Info", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }
            // Prompt for template name
            var name = InputDialog.Show("Save Template", "Enter a template name:");
            if (string.IsNullOrWhiteSpace(name)) return;
            // Create and add custom template
            var template = new FlowTemplate { Name = name, Description = _autoDesc.Text };
            _customTemplates.Add(template);
            _autoTemplate.Items.Add(template.Name);
            MessageBox.Show(this, $"Template '{name}' saved.", "Template Saved", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        /// <summary>
        /// Schedule the current flow to run on a timer. Prompts the user for the interval in minutes
        /// and whether to repeat, then sets up a System.Windows.Forms.Timer to invoke the flow.
        /// </summary>
        private void ScheduleButton_Click(object? sender, EventArgs e)
        {
            // Ensure there is a suggested template or description
            if (string.IsNullOrWhiteSpace(_autoDesc.Text) && string.IsNullOrWhiteSpace(_txtFilePath.Text))
            {
                MessageBox.Show(this, "Please enter a description and/or select a data file before scheduling a flow.", "Info", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }
            // Ask for interval in minutes
            var intervalStr = InputDialog.Show("Schedule Flow", "Enter interval in minutes:");
            if (string.IsNullOrWhiteSpace(intervalStr) || !int.TryParse(intervalStr, out int minutes) || minutes <= 0)
            {
                MessageBox.Show(this, "Invalid interval.", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }
            // Ask for repetition
            var repeat = MessageBox.Show(this, "Repeat this flow on every interval?", "Repeat", MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes;
            // Determine or create a flow template for scheduling
            FlowTemplate template;
            var selected = _autoTemplate.SelectedItem as string;
            if (!string.IsNullOrEmpty(selected))
            {
                // Use selected template from dropdown or custom list
                template = _templateManager.All().FirstOrDefault(t => t.Name == selected) ?? _customTemplates.FirstOrDefault(t => t.Name == selected) ?? new FlowTemplate { Name = selected, Description = _autoDesc.Text };
            }
            else
            {
                // Create a simple template based on description
                template = new FlowTemplate { Name = _autoDesc.Text ?? "Scheduled Flow", Description = _autoDesc.Text };
            }
            // Create timer
            var timer = new System.Windows.Forms.Timer { Interval = minutes * 60 * 1000 };
            timer.Tick += (_, __) =>
            {
                // Simulate running the flow; update result and flows list
                RunFlow(template);
                if (!repeat)
                {
                    timer.Stop();
                }
            };
            timer.Start();
            _scheduled.Add((template, timer));
            MessageBox.Show(this, $"Flow '{template.Name}' scheduled every {minutes} minute(s).", "Scheduled", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        /// <summary>
        /// Simulate running a flow; updates the result box and list view.
        /// In a real implementation this would trigger the actual Power Automate flow or script.
        /// </summary>
        private void RunFlow(FlowTemplate template)
        {
            // For demonstration, just log the time and template name
            var timestamp = DateTime.Now.ToString("HH:mm:ss");
            _autoResult.AppendText($"\r\n[{timestamp}] Flow '{template.Name}' executed.");
            // Optionally update flows list (simulate status update)
            var item = _autoFlows.Items.Cast<ListViewItem>().FirstOrDefault(i => i.Text == template.Name);
            if (item == null)
            {
                item = new ListViewItem(new[] { template.Name, "Running", "Just now", "Scheduled" });
                _autoFlows.Items.Add(item);
            }
            else
            {
                item.SubItems[1].Text = "Running";
                item.SubItems[2].Text = "Just now";
                item.SubItems[3].Text = "Scheduled";
            }
        }

        /// <summary>
        /// Simple input dialog to prompt the user for a text value.
        /// </summary>
        private static class InputDialog
        {
            public static string? Show(string title, string prompt)
            {
                using var frm = new Form
                {
                    Text = title,
                    Width = 400,
                    Height = 160,
                    FormBorderStyle = FormBorderStyle.FixedDialog,
                    StartPosition = FormStartPosition.CenterParent,
                    MinimizeBox = false,
                    MaximizeBox = false,
                };
                var lbl = new Label { Text = prompt, AutoSize = true, Top = 20, Left = 10 };
                var txt = new TextBox { Top = 50, Left = 10, Width = 360 };
                var ok = new Button { Text = "OK", DialogResult = DialogResult.OK, Top = 90, Left = 210 };
                var cancel = new Button { Text = "Cancel", DialogResult = DialogResult.Cancel, Top = 90, Left = 290 };
                frm.Controls.AddRange(new Control[] { lbl, txt, ok, cancel });
                frm.AcceptButton = ok;
                frm.CancelButton = cancel;
                return frm.ShowDialog() == DialogResult.OK ? txt.Text : null;
            }
        }
    }
}