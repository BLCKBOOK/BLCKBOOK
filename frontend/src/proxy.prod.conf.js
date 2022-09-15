const PROXY_CONFIG = [
  {
    context: [
      '/prod',
    ],
    target: 'https://c7kqqn31jg.execute-api.eu-west-1.amazonaws.com', // has to be set manually for the proxy
    changeOrigin: true,
    secure: false,
    logLevel: "debug",
  }
]

module.exports = PROXY_CONFIG;
