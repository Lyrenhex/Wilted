#!/usr/bin/env node

/*
No clue wtf happened, but websockets stopped behaving as they usually do, and nodejs killed the listener. This version works based on files.
*/

const fs = require('fs');
const os = require('os');
const request = require('request');
const querystring = require('querystring');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var lastSong = {
  song: {
    title: null
  },
  time: {
    current: null
  }
};

try{
  var conf = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
}catch(err){
  conf = {
    username: false,
    password: false,
    api: conf.api,
    websocket: conf.websocket
  }
  console.log("Whoops, badly formatted JSON config. Please make sure that your username and password are both encased in quotes (\"s) and that you have not drastically changed the format of the file. Thanks!")
}

var Auth = {
  'token': '',
  'drfHeader': ''
};

if (conf.username === false || conf.password === false) {
  rl.question("Please enter your Wilt.fm username: ", (username) => {
    conf.username = username;
    rl.question("Please enter your Wilt.fm password: ", (password) => {
      conf.password = password;
      // save the new values
      fs.writeFileSync('config.json', JSON.stringify(conf, null, 2), 'utf-8');
      init();
    });
  });
} else {
  init();
}

function init() {
  console.log (`Logging in to Wilt.fm as ${conf.username}...`);
  request.post(
    `${conf.api}api-token-auth/`,
    { json: {
      'username': conf.username,
      'password': conf.password
    }},
    function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log('Logged in to Wilt.fm.');
        Auth.token = body.token;
        Auth.drfHeader = `Token ${Auth.token}`;
        force();
        check();
      } else if(error) {
          console.log(error);
      } else {
        console.log(response, body);
      }
    });
}

function force() {
  rl.question('', (answer) => {
    // user initiated a forced check
    console.log("Forcing re-check...");
    check();
    force();
  });
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
          if(json.song.title === lastSong.song.title && json.time.current >= lastSong.time.current){
            setTimeout(check, 10000);
          }else{
            var nextCheck = json.time.total - (json.time.current - 5000);
            setTimeout(check, nextCheck); // check once the song is over, and give a 5sec grace period for GPMDP (2sec was apparently too small a time)
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
