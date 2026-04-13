Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

Add-Type @"
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Runtime.InteropServices;
using System.Windows.Forms;

public class LaserOverlay : Form
{
    [DllImport("user32.dll")]
    static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);
    [DllImport("user32.dll")]
    static extern int GetWindowLong(IntPtr hWnd, int nIndex);

    const int GWL_EXSTYLE = -20;
    const int WS_EX_LAYERED = 0x80000;
    const int WS_EX_TRANSPARENT = 0x20;
    const int WS_EX_TOOLWINDOW = 0x80;

    private float dotX = -1f;
    private float dotY = -1f;
    private bool dotVisible = false;
    private string dataFile;
    private Timer timer;
    private DateTime lastRead = DateTime.MinValue;

    public LaserOverlay(string file)
    {
        dataFile = file;
        FormBorderStyle = FormBorderStyle.None;
        WindowState = FormWindowState.Maximized;
        TopMost = true;
        ShowInTaskbar = false;
        BackColor = Color.Black;
        TransparencyKey = Color.Black;
        DoubleBuffered = true;

        timer = new Timer();
        timer.Interval = 16; // ~60fps
        timer.Tick += OnTick;
        timer.Start();
    }

    protected override void OnLoad(EventArgs e)
    {
        base.OnLoad(e);
        int style = GetWindowLong(Handle, GWL_EXSTYLE);
        SetWindowLong(Handle, GWL_EXSTYLE, style | WS_EX_LAYERED | WS_EX_TRANSPARENT | WS_EX_TOOLWINDOW);
    }

    protected override CreateParams CreateParams
    {
        get
        {
            CreateParams cp = base.CreateParams;
            cp.ExStyle |= WS_EX_LAYERED | WS_EX_TRANSPARENT | WS_EX_TOOLWINDOW;
            return cp;
        }
    }

    private void OnTick(object sender, EventArgs e)
    {
        try
        {
            if (!File.Exists(dataFile)) return;
            DateTime mod = File.GetLastWriteTimeUtc(dataFile);
            if (mod == lastRead) return;
            lastRead = mod;

            string json = File.ReadAllText(dataFile).Trim();
            if (string.IsNullOrEmpty(json)) return;

            // Simple JSON parsing without external libs
            bool vis = json.Contains("\"visible\":true");
            float x = -1, y = -1;

            int xi = json.IndexOf("\"x\":");
            int yi = json.IndexOf("\"y\":");
            if (xi >= 0 && yi >= 0)
            {
                string xPart = json.Substring(xi + 4);
                string yPart = json.Substring(yi + 4);
                xPart = xPart.Split(new char[]{',','}'})[0].Trim();
                yPart = yPart.Split(new char[]{',','}'})[0].Trim();
                float.TryParse(xPart, System.Globalization.NumberStyles.Float,
                    System.Globalization.CultureInfo.InvariantCulture, out x);
                float.TryParse(yPart, System.Globalization.NumberStyles.Float,
                    System.Globalization.CultureInfo.InvariantCulture, out y);
            }

            bool changed = (vis != dotVisible) || (Math.Abs(x - dotX) > 0.001f) || (Math.Abs(y - dotY) > 0.001f);
            dotVisible = vis;
            dotX = x;
            dotY = y;

            if (changed) Invalidate();
        }
        catch { }
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        e.Graphics.Clear(BackColor);
        if (!dotVisible || dotX < 0 || dotY < 0) return;

        e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
        Rectangle screen = Screen.PrimaryScreen.Bounds;
        float cx = dotX * screen.Width;
        float cy = dotY * screen.Height;

        // Outer glow
        float glowR = 28f;
        using (var path = new GraphicsPath())
        {
            path.AddEllipse(cx - glowR, cy - glowR, glowR * 2, glowR * 2);
            using (var brush = new PathGradientBrush(path))
            {
                brush.CenterColor = Color.FromArgb(80, 255, 50, 50);
                brush.SurroundColors = new Color[] { Color.FromArgb(0, 255, 0, 0) };
                e.Graphics.FillEllipse(brush, cx - glowR, cy - glowR, glowR * 2, glowR * 2);
            }
        }

        // Core dot
        float coreR = 7f;
        using (var brush = new SolidBrush(Color.FromArgb(240, 255, 60, 60)))
        {
            e.Graphics.FillEllipse(brush, cx - coreR, cy - coreR, coreR * 2, coreR * 2);
        }

        // Bright center
        float innerR = 3f;
        using (var brush = new SolidBrush(Color.FromArgb(200, 255, 180, 180)))
        {
            e.Graphics.FillEllipse(brush, cx - innerR, cy - innerR, innerR * 2, innerR * 2);
        }
    }
}
"@ -ReferencedAssemblies System.Drawing, System.Windows.Forms

$dataFile = $args[0]
if (-not $dataFile) {
    Write-Host "Usage: overlay.ps1 <data-file-path>"
    exit 1
}

# Write initial hidden state
'{"x":-1,"y":-1,"visible":false}' | Set-Content -Path $dataFile

$form = New-Object LaserOverlay($dataFile)
[System.Windows.Forms.Application]::Run($form)
