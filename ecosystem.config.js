module.exports = {
  apps : [{
    name   : "CIM",
    script : "./index.js",
    kill_timeout : 8000,
    wait_ready: true,
    listen_timeout: 20000,
    shutdown_with_message: true,
    exec_mode: 'cluster',
    instances: 1
  }]
}
