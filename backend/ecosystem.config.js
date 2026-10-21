module.exports = {
  apps: [
    {
      name: "api",
      script: "./server.js",        // Express бол entry файл
      cwd: "/home/cardealer.project/backend",
      instances: 1,                 // "max" бол cluster mode
      exec_mode: "fork",            // cluster хэрэгтэй бол "cluster"
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },
      max_memory_restart: "500M",
      autorestart: true,
      watch: false,
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      time: true
    },
    {
      name: "web",                  // Next.js жишээ
      script: "npm",
      args: "start",
      cwd: "/home/cardealer.project/frontend",
      env: { NODE_ENV: "production", PORT: 3001 }
    }
  ]
};