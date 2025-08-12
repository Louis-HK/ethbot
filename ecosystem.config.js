module.exports = {
  apps: [
    {
      name: "ethbot",
      script: "./bot.js",
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};