/** Node application driver **/
const spawn = require('child_process').spawn;
const fs = require('fs');
const mailer = require('./mailer');

// create or truncate(clear) the log for new notifications
fs.closeSync(fs.openSync('./logs/newNotifications.json', 'w'));

// spawn child process to run casperjs and scrape espn for new league activity notifications
const casperjs = spawn('casperjs', ['leagueActivity.js']);

// log console output from leagueActivity script
casperjs.stdout.on('data', function (data) {
  console.log('leagueActivity: ' + data);
});

// the child process has terminated
casperjs.on('close', function (signal) {
  if(signal == 0) {
    // check the new notifications log
    var newNotifsLog = './logs/newNotifications.json';
    var data = fs.readFileSync(newNotifsLog);
    if(data.length > 0){
      // send notification(s) as JSON array
      try {
        mailer.sendNotification(JSON.parse(data));
      } catch(error) {
        console.log(error);
      }
    }
  }
});
