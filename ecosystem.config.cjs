module.exports = {
  apps: [
    {
      name: 'sales-mkt-agent',
      script: 'src/server.js',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_memory_restart: '300M',
      time: true,
      out_file: 'logs/app-out.log',
      error_file: 'logs/app-error.log',
      env: {
        NODE_ENV: 'production',
        TZ: 'America/Sao_Paulo'
      }
    }
  ]
};
