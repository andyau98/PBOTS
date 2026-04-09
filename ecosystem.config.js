module.exports = {
  apps: [{
    name: 'engineering-whatsapp-bot',
    script: 'src/index.js',
    
    // 進程管理
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    
    // 環境變量
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    
    // 日誌配置
    log_file: './logs/pm2-combined.log',
    out_file: './logs/pm2-out.log',
    error_file: './logs/pm2-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // 進程參數
    node_args: '--max-old-space-size=500',
    
    // 重啟策略
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    
    // 監控和性能
    kill_timeout: 5000,
    listen_timeout: 3000
  }]
};