module.exports = {
    apps: [
        {
            name: 'widgetdc-backend',
            script: 'start-backend.bat',
            interpreter: 'cmd.exe', // Kør som batch script
            interpreter_args: '/c',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'development',
                PORT: 3001,
            },
        },
        {
            name: 'widgetdc-frontend',
            script: 'start-frontend.bat',
            interpreter: 'cmd.exe',
            interpreter_args: '/c',
            instances: 1,
            autorestart: true,
            watch: false,
            env: {
                PORT: 8888,
            },
        }
    ],
};
