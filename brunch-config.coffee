module.exports = config:
  paths:
    watched: ['app']
  files:
    javascripts: joinTo: 'app.js'
    stylesheets: joinTo: 'main.css'
  plugins:
    sass:
      mode: 'native'
    babel:
      ignore: []
      pattern: /\.js$/
  server:
      run: yes
      port: 5006

