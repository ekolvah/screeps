module.exports = {
  servers: {
    main: {
      host: 'screeps.com',
      port: 443,
      secure: true,
      token: process.env.SCREEPS_TOKEN,
      branch: 'main',
      path: process.cwd() + '/dist'
    }
  }
}; 