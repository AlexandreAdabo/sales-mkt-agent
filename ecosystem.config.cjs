module.exports = {
  apps: [
    {
      name: 'sales-mkt-agent',
      cwd: __dirname,
      script: 'src/server.js',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      time: true,
      kill_timeout: 10000,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      out_file: 'logs/app-out.log',
      error_file: 'logs/app-error.log',
      env: {
        NODE_ENV: 'production',
        TZ: 'America/Sao_Paulo'
      }
    }
  ]
};
