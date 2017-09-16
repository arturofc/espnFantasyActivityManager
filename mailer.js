const nodemailer = require('nodemailer');
const EmailTemplate = require('email-templates').EmailTemplate;
const path = require('path');
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

module.exports.sendNotification = function(notifications) {
  // wrap notifications array in object to render in handlebars template engine
  var wrapper = {
    notifications: notifications,
    length: notifications.length
  };

  // Render and send email
  template.render(wrapper, function (error, result) {
    if (error) {
      throw new Error(error);
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
            throw new Error(error);
          }
          console.log('Notification email sent: %s', info.messageId);
      });

  });
};
