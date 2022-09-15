const PROXY_CONFIG = [
  {
    context: [
      '/dev',
    ],
    target: 'https://7gi6m08p27.execute-api.eu-west-1.amazonaws.com', // has to be set manually for the proxy
    changeOrigin: true,
    secure: false,
    logLevel: "debug",
  }
]

module.exports = PROXY_CONFIG;
