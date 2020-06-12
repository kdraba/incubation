const RESTART_DELAY = 100

module.exports = {
  apps: [
    {
      name: 'browsersync',
      script: 'node_modules/.bin/browser-sync',
      args: [
        'start',
        '-s',
        '--cwd',
        '.',
        '--port',
        '3000',
        '--directory',
        '--no-open',
        '--no-ui',
      ],
      instances: 1,
      autorestart: true,
      exp_backoff_restart_delay: RESTART_DELAY,
    },
    {
      name: 'build:watch',
      script: 'node_modules/typescript/lib/tsc.js',
      args: ['--build', '--watch', '--preserveWatchOutput'],
      instances: 1,
      autorestart: true,
      exp_backoff_restart_delay: RESTART_DELAY,
    },
    {
      name: 'bundle:watch',
      script: 'node_modules/rollup/dist/bin/rollup',
      args: ['--config', 'rollup.config.js', '--watch'],
      instances: 1,
      autorestart: true,
      exp_backoff_restart_delay: RESTART_DELAY,

      //watch: ['**/rollup.config.js', 'yarn.lock'],
      watch_delay: 1000,
      ignore_watch: [],
      watch_options: {
        followSymlinks: false,
      },
    },
  ],
}
