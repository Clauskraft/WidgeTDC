const { exec } = require('child_process');

// Test PowerShell command
const psCmd = `
    Get-NetTCPConnection -State Established |
    Where-Object { $_.RemoteAddress -ne "127.0.0.1" -and $_.RemoteAddress -ne "::1" -and $_.RemoteAddress -notlike "192.168.*" -and $_.RemoteAddress -notlike "10.*" -and $_.RemoteAddress -notlike "172.*" } |
    Select-Object OwningProcess, RemoteAddress, RemotePort, @{Name="ProcessName";Expression={(Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).ProcessName}} |
    ConvertTo-Json -Depth 2
`;

console.log('Testing PowerShell network command...');

exec(`powershell -Command "& { ${psCmd} }"`, { shell: 'powershell.exe' }, (err, stdout, stderr) => {
    if (err) {
        console.error('Error:', err);
        console.error('stderr:', stderr);
        return;
    }

    try {
        const connections = JSON.parse(stdout || '[]');
        const list = Array.isArray(connections) ? connections : [connections];

        console.log(`Found ${list.length} external connections`);

        // Provider mapping
        const PROVIDER_MAP = {
            'chrome': 'Google',
            'GoogleUpdate': 'Google',
            'Adobe Desktop Service': 'Adobe',
            'Creative Cloud': 'Adobe',
            'Photoshop': 'Adobe',
            'Spotify': 'Spotify AB',
            'steam': 'Valve',
            'NVIDIA Share': 'NVIDIA',
            'Discord': 'Discord Inc',
            'Teams': 'Microsoft',
            'msedge': 'Microsoft'
        };

        const report = list.map((conn) => {
            const procName = conn.ProcessName || "Unknown";
            let provider = "Other";

            for (const [key, value] of Object.entries(PROVIDER_MAP)) {
                if (procName.toLowerCase().includes(key.toLowerCase())) {
                    provider = value;
                    break;
                }
            }

            return {
                provider,
                process: procName,
                destination: conn.RemoteAddress,
                port: conn.RemotePort
            };
        });

        const stats = report.reduce((acc, curr) => {
            acc[curr.provider] = (acc[curr.provider] || 0) + 1;
            return acc;
        }, {});

        console.log('Stats:', stats);
        console.log('Sample connections:', report.slice(0, 3));

    } catch (e) {
        console.error('Parse error:', e);
        console.log('Raw output:', stdout);
    }
});