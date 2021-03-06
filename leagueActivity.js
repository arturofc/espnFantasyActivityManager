const casper = require('casper').create();
const fs = require('fs');
const config = require('./config'),
      espnLeagueUrl = 'http://games.espn.com/ffl/leagueoffice?leagueId=' + config.espnLeagueId;
// Paths to json log files
const leagueActivityLog = './logs/leagueActivityLog.json',
      newNotifsLog = './logs/newNotifications.json';

casper.start(espnLeagueUrl)
      .waitForSelector('div[id=disneyid-wrapper][class=state-active]',
        function() {
          this.echo('attemping to login..');
        },
        function() {
          this.echo("Failed to find login iframe");
          this.exit(1);
      }, 10000)
      // access the login screen iframe and fill credentials and submit
      .withFrame('disneyid-iframe',
        function(){
          this.sendKeys('input[type=email]', config.espnUser+'');
          this.sendKeys('input[type=password]', config.espnPass+'');
          this.click('.btn-submit');
          this.echo('Logged-In!');
      })
      // View all league activity
      .waitForSelector('li[id=lo-recent-activity-tools] a',
          function() {
            this.click('li[id=lo-recent-activity-tools] a');
          },
          function() {
            this.echo("Failed to find league activity button bar");
            this.exit(1);
      }, 10000)
      .waitForSelector('table .tableBody',
          function() {
            if(!fs.exists(leagueActivityLog)) {
              fs.touch(leagueActivityLog); // create the league activity log if it doesn't exist

              // get the full table of league activity notifications
              var notifications = this.evaluate(function() {
                var tableRows = document.querySelector('table .tableBody').rows;
                var notifs = [];
                for (i = 2; i < tableRows.length; i++) {
                  var rowCells = tableRows.item(i).cells;

                  // get all the links in the row's action cell
                  var items = rowCells.item(3).children;
                  var actionLinks = [];
                  for(j = 0; j < items.length; j++) {
                    if (items.item(j).localName == 'a') {
                      actionLinks.push({
                        text: items.item(j).innerText,
                        href: items.item(j).href
                      });
                    }
                  }
                  // create notification objects to hold the row's info
                  notifs.push({
                    time: rowCells.item(0).innerText,
                    type: rowCells.item(1).innerText,
                    detail: rowCells.item(2).innerText,
                    action: actionLinks
                  });
                }
                return notifs;
              });

              // dump the league activity into log file
              var data = JSON.stringify(notifications, null, 2);
              fs.write(leagueActivityLog, data, 'w');

            } else {
              this.echo('checking for new notifications...');
              var data = fs.read(leagueActivityLog);
              notifications = JSON.parse(data);
              // compare number of rows in current table to number of notification objects in log file
              var newNotifications = this.evaluate(function(oldLength) {
                var tableRows = document.querySelector('table .tableBody').rows;
                var difference = (tableRows.length - 2) - oldLength;
                var newNotifs = [];
                if(difference == 0) {
                  // no new notifications appeared
                  return newNotifs;
                }
                // get the new notification objects
                for(i = 2; i < difference + 2; i++) {
                  var rowCells = tableRows.item(i).cells;

                  // get all the links in the row's action cell
                  var items = rowCells.item(3).children;
                  var actionLinks = [];
                  for(j = 0; j < items.length; j++) {
                    if (items.item(j).localName == 'a') {
                      actionLinks.push({
                        text: items.item(j).innerText,
                        href: items.item(j).href
                      });
                    }
                  }
                  // create notification objects to hold the row's info
                  newNotifs.push({
                    time: rowCells.item(0).innerText,
                    type: rowCells.item(1).innerText,
                    detail: rowCells.item(2).innerText,
                    action: actionLinks
                  });
                }
                return newNotifs;
              }, notifications.length);

              fs.touch(newNotifsLog);
              if(newNotifications.length > 0) {
                this.echo(newNotifications.length + ' new notifications in league activity');
                // create a new notifications log to check after casper process completes
                var newData = JSON.stringify(newNotifications, null, 2);
                fs.write(newNotifsLog, newData, 'w');

                // update the overall league activity log
                for(i = 0; i < newNotifications.length; i++) {
                  notifications.unshift(newNotifications[i]);
                }
                var data = JSON.stringify(notifications, null, 2);
                fs.write(leagueActivityLog, data, 'w');
              }else{
                this.echo('no new league notifications');
              }
            }
          },
          function() {
            this.echo("Failed to find full league activity table");
            this.exit(1);
      }, 10000)
      .run();

// DEBUGGING
// output from casperjs environment
// casper.on('remote.message', function(msg) {
//     this.echo(msg);
// });

// screen capture settings
// casper.options.viewportSize = { width: 950, height: 950 };
