const websocket = require('nodejs-websocket');
const fs = require('fs');
const request = require('request');
var querystring = require('querystring');

try{
  var conf = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
}catch(err){
  conf = {
    username: false,
    password: false
  }
  console.log("Whoops, badly formatted JSON config. Please make sure that your username and password are both encased in quotes (\"s) and that you have not drastically changed the format of the file. Thanks!")
}

if(conf.username !== false && conf.password !== false){
  var Auth = {
    'token': '',
    'drfHeader': ''
  };

  request.post(
    `${conf.api}api-token-auth/`,
    { json: {
      'username': conf.username,
      'password': conf.password
    }},
    function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log('Connected to WILT API and logged in');
        start();
        Auth.token = body.token;
        Auth.drfHeader = `Token ${Auth.token}`;
      } else if(error) {
          console.log(error);
      } else {
        console.log(response, body);
      }
    });
} else {
  console.log('Yo, you need to set your WILT.fm username and password in the config.json file.');
  process.exit();
}

function start() {
  var wsClient = websocket.connect(conf.websocket, connected);
  wsClient.on('error', function (error) {
    if (error.toString().indexOf('ECONNREFUSED') > -1) {
      console.log('Socket connection was refused!');
      console.log('Please ensure that Google Play Music Desktop Player is currently running, and that you have enabled "Enable Playback API" in the player settings (restart the player after enabling this option).');
      console.log('Retrying in 10 seconds...');
      setTimeout(start, 10000);
    } else {
      console.log('error', error);
    }
  });

    function connected() {
      console.log('Connected to websocket');
      wsClient.on('text', function (str) {
        var json = JSON.parse(str);
        if (json.channel == 'track') {
          var song = json.payload;
          if (song.title !== null) {
            if (song.title.toLowerCase().indexOf('(explicit)') > -1) {
              song.title = song.title.replace(/(explicit)/ig, '');
              if (song.title.indexOf('()') > -1) {
                song.title = song.title.replace('()', '');
              }
            }

            var scrobbleData = {
              song: song.title,
              artist: song.artist,
              album: song.album
            }
            var scrobbleSend = querystring.stringify(scrobbleData);
            var contentLength = scrobbleSend.length;
            request({
              headers: {
                'Authorization': Auth.drfHeader
              },
              url: `${conf.api}scrobbles/`,
              json: true,
              body: {
                'song': song.title,
                'artist': song.artist,
                'album': song.album
              },
              method: 'POST'
            },
            function (error, response, body) {
              if (!error && response.statusCode == 200) {
                console.log(`Scrobbled ${song.title} by ${song.artist} on the album ${song.album}`);
              } else if(error) {
                console.log(error);
              } else {
                console.log(response, body);
              }
            });
            }
          }
        });
    }
}
