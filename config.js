module.exports = {
  // Credentials for a email account which to send notifications from
  emailUser: '',
  emailPass: '',
  
  emailService: '', // The service which the email account is using, example: 'gmail'
  sendFrom: '', // How the notifcation sender will be appear to the recipients, Example: '"EXAMPLE" <xxxx@gmail.com>'
  
  // List of users which notification emails will be sent to
  sendTo: [
    ''
  ],
  
  // Credentials for a espn account within the fantasy league (allows the scraper to log in and view league activity)
  espnUser: '', 
  espnPass: '',
  
  espnLeagueId: '' // the unique id for your espn fantasy league
};
