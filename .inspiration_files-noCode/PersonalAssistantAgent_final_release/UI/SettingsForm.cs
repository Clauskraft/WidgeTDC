using System;
using System.Drawing;
using System.Windows.Forms;
using PersonalAssistantAgent.Models;

namespace PersonalAssistantAgent.UI
{
    /// <summary>
    /// Presents a simple dialog for editing persistent application settings such as company name,
    /// primary color and default AI model.
    /// </summary>
    public sealed class SettingsForm : Form
    {
        private readonly AppSettings _settings;
        private TextBox _txtCompany = null!;
        private Panel _pPrimary = null!;
        private ComboBox _cmbDefaultModel = null!;

        public SettingsForm(AppSettings settings)
        {
            _settings = settings;
            BuildForm();
            LoadCurrent();
        }

        private void BuildForm()
        {
            Text = "Settings";
            StartPosition = FormStartPosition.CenterParent;
            FormBorderStyle = FormBorderStyle.FixedDialog;
            MaximizeBox = false;
            MinimizeBox = false;
            Size = new Size(520, 260);

            var root = new TableLayoutPanel
            {
                Dock = DockStyle.Fill,
                Padding = new Padding(16),
                ColumnCount = 2,
                RowCount = 3,
                AutoSize = true
            };
            root.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 150));
            root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));

            root.Controls.Add(new Label { Text = "Company Name:", AutoSize = true, Anchor = AnchorStyles.Left }, 0, 0);
            _txtCompany = new TextBox { Dock = DockStyle.Fill };
            root.Controls.Add(_txtCompany, 1, 0);

            root.Controls.Add(new Label { Text = "Primary Color:", AutoSize = true, Anchor = AnchorStyles.Left }, 0, 1);
            _pPrimary = new Panel { Dock = DockStyle.Left, Size = new Size(100, 26), BorderStyle = BorderStyle.FixedSingle, BackColor = Color.FromArgb(0, 120, 212), Cursor = Cursors.Hand };
            _pPrimary.Click += (_, __) => {
                using var cd = new ColorDialog { Color = _pPrimary.BackColor };
                if (cd.ShowDialog() == DialogResult.OK)
                {
                    _pPrimary.BackColor = cd.Color;
                }
            };
            root.Controls.Add(_pPrimary, 1, 1);

            root.Controls.Add(new Label { Text = "Default AI Model:", AutoSize = true, Anchor = AnchorStyles.Left }, 0, 2);
            _cmbDefaultModel = new ComboBox { Dock = DockStyle.Fill, DropDownStyle = ComboBoxStyle.DropDownList };
            _cmbDefaultModel.Items.AddRange(new object[] { "GPT-4o (Recommended)", "GPT-4o-mini (Fast)", "Claude 3.5 Sonnet", "Claude 3 Haiku (Budget)" });
            root.Controls.Add(_cmbDefaultModel, 1, 2);

            var btns = new FlowLayoutPanel { Dock = DockStyle.Bottom, FlowDirection = FlowDirection.RightToLeft, Padding = new Padding(10), Height = 50 };
            var ok = new Button { Text = "Save", DialogResult = DialogResult.OK, AutoSize = true };
            ok.Click += SaveSettings;
            var cancel = new Button { Text = "Cancel", DialogResult = DialogResult.Cancel, AutoSize = true };
            btns.Controls.Add(cancel);
            btns.Controls.Add(ok);

            Controls.Add(root);
            Controls.Add(btns);
        }

        private void LoadCurrent()
        {
            _txtCompany.Text = _settings.CompanyName;
            _pPrimary.BackColor = _settings.PrimaryColor;
            _cmbDefaultModel.SelectedItem = _settings.DefaultModel;
        }

        private void SaveSettings(object? sender, EventArgs e)
        {
            _settings.CompanyName = _txtCompany.Text;
            _settings.PrimaryColor = _pPrimary.BackColor;
            _settings.DefaultModel = _cmbDefaultModel.SelectedItem?.ToString() ?? _settings.DefaultModel;
        }
    }
}