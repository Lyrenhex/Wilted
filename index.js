/*
No clue wtf happened, but websockets stopped behaving as they usually do, and nodejs killed the listener. This version works based on files.
*/

const fs = require('fs');
const os = require('os');
const request = require('request');
var querystring = require('querystring');

var lastSong;

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
        Auth.token = body.token;
        Auth.drfHeader = `Token ${Auth.token}`;
        check();
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

function check() {
  var filloc;
  switch (os.platform()){
    case "linux":
      filloc = `${process.env.HOME}/.config/Google Play Music Desktop Player/json_store/playback.json`;
      break;
    case "win32":
      filloc = `${process.env.APPDATA}\\Google Play Music Desktop Player\\json_store\\playback.json`;
      break;
    case "darwin":
      filloc = `${process.env.HOME}/Library/Application Support/Google Play Music Desktop Player/json_store/playback.json`;
      break;
  }
  fs.readFile(filloc, (err, data) => {
    if (err) {
      console.log("Couldn't read the JSON data file: ", err);
      setTimeout(check, 10000);
    }else{
      try {
        var json = JSON.parse(data);

        if(json.playing){
          if(json.song.title === lastSong.title && json.time.current >= lastSong.time.current){
            setTimeout(check, 10000);
          }else{
            var nextCheck = json.time.total - (json.time.current - 2000);
            setTimeout(check, nextCheck); // check once the song is over, and give a 2sec grace period for GPMDP
            lastSong = json;
            request({
              headers: {
                'Authorization': Auth.drfHeader
              },
              url: `${conf.api}scrobbles/`,
              json: true,
              body: {
                'song': json.song.title,
                'artist': json.song.artist,
                'album': json.song.album
              },
              method: 'POST'
            },
            function (error, response, body) {
              if (!error && response.statusCode == 200) {
                console.log(`Scrobbled ${json.song.title} by ${json.song.artist} on the album ${json.song.album}. Checking next in ${nextCheck / 1000} seconds.`);
              } else if(error) {
                console.log(error);
              } else {
                console.log(response, body);
              }
            });
          }
        }else {
          setTimeout(check, 10000);
        }
      }catch(e){
        console.log("Uhh... JSON data file empty?");
        console.log(e);
        setTimeout(check, 10000);
      }
    }
  });
}
