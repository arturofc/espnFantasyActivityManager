/** Node application driver **/

// Node Modules
var spawn = require('child_process').spawn;
var fs = require('fs');
var nodemailer = require('nodemailer');
var path = require('path');
var EmailTemplate = require('email-templates').EmailTemplate;

// app configuration file
const config = require('./config');

// nodemailer configuration
var transporter = nodemailer.createTransport({
  service: config.emailService,
  auth: {
    user: config.emailUser,
    pass: config.emailPass
  }
});

// email-templates configuration
var templateDir = path.join(__dirname, 'templates', 'notificationEmail');
var template = new EmailTemplate(templateDir);

//spawn child process to run casperjs and scrape espn for new league activity notifications
var casperjs = spawn('casperjs', ['leagueActivity.js']);

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
      fs.truncate(newNotifsLog, function() {
        console.log('new notifications log has been read and cleared');
      });
      // send notification(s) as JSON array
      sendNotification(JSON.parse(data));
    }
  }
});


function sendNotification(notifications) {
  // wrap notifications array in object to render in handlebars template engine
  var wrapper = {
    notifications: notifications,
    length: notifications.length
  };

  // Render and send email
  template.render(wrapper, function (err, result) {
    if (err) {
      return console.error(err)
    }

    // setup email data
      let mailOptions = {
          from: config.sendFrom,
          to: config.sendTo.toString(),
          subject: result.subject,
          text: result.text,
          html: result.html
      };

      // send mail
      transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
              return console.log(error);
          }
          console.log('Notification email sent: %s', info.messageId);
      });

  });
}
