/*
Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

    http://aws.amazon.com/apache2.0/

or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/*

  Set Javascript specific to the extension viewer view in this file.

*/
if (window.Twitch.ext) {
  window.Twitch.ext.onAuthorized(function(auth) {
      (function update() {
        var data = {
                "channel_id": auth.channelId
            };
        $.ajax({
            url: 'https://dotastreaks.com/userUpdate',
            type: 'POST',
            headers: {
                'x-extension-jwt': auth.token
            },
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            data: JSON.stringify(data),
            success: function(data) {
                      trackData(data);
            },
            complete: function() {
              // Schedule the next request when the current one's complete
              setTimeout(update, 30000);
            }
        }); 
    })();
  });
}

var goodStats = "rgb(102, 255, 153)"
var regStats = "rgb(139, 0, 0)"

function trackData(data) {
    console.log(data)
    var choice = [];
    var count = 0;
    for (var i = 0; i < data.Choice.length; i++) {
        if (data.Choice[i] == true) {
            choice[count] = i;
            count++;
        }
    }
    
    //now work with block1
    var ch1 = choice[0];
    var txt = $("#stat1").text();
    var now1;
    switch (txt) {
        case "Streak":
            now1 = 0;
            break;
        case "Kills":
            now1 = 1;
            break;
        case "Deaths":
            now1 = 2;
            break;
        case "GPM":
            now1 = 3;
            break;
        case "XPM":
            now1 = 4;
            break;
        case "Level":
            now1 = 5;
            break;
    }
    if (now1 != ch1) {
        //make invisible while putting data in
        $('#block1').css({opacity: 1.0, visibility: "visible"}).animate({opacity: 0}, 600);
    }
    //else just change data
    switch(ch1) {
    case 0:
        $("#stat1").text("Streak");
        $("#val1").text(data.Streak);
        break;
    case 1:
        $("#stat1").text("Kills");
        $("#val1").text(data.Kills);
        break;
    case 2:
        $("#stat1").text("Deaths");
        $("#val1").text(data.Deaths);
        break;
    case 3:
        $("#stat1").text("GPM");
        $("#val1").text(Math.floor(data.GPM / ((data.Streak == 0) ? 1 : data.Streak)));
        break;
    case 4:
        $("#stat1").text("XPM");
        $("#val1").text(Math.floor(data.XPM / ((data.Streak == 0) ? 1 : data.Streak)));
        break;
    case 5:
        $("#stat1").text("Level");
        $("#val1").text(Math.floor(data.XPM / ((data.Streak == 0) ? 1 : data.Streak)));
    }
    //show back if was hidden
    if (now1 != ch1) {
        $('#block1').css({opacity: 0.0, visibility: "visible"}).animate({opacity: 1.0});
    }
    
    //now work with block2
    var ch2 = choice[1];
    txt = $("#stat2").text();
    var now2;
    switch (txt) {
        case "Streak":
            now2 = 0;
            break;
        case "Kills":
            now2 = 1;
            break;
        case "Deaths":
            now2 = 2;
            break;
        case "GPM":
            now2 = 3;
            break;
        case "XPM":
            now2 = 4;
            break;
        case "Level":
            now2 = 5;
            break;
    }
    if (now2 != ch2) {
        //make invisible while putting data in
        $('#block2').css({opacity: 1.0, visibility: "visible"}).animate({opacity: 0}, 600);
    }
    //else just change data
    switch(ch2) {
    case 0:
        $("#stat2").text("Streak");
        $("#val2").text(data.Streak);
        break;
    case 1:
        $("#stat2").text("Kills");
        $("#val2").text(data.Kills);
        break;
    case 2:
        $("#stat2").text("Deaths");
        $("#val2").text(data.Deaths);
        break;
    case 3:
        $("#stat2").text("GPM");
        $("#val2").text(Math.floor(data.GPM / ((data.Streak == 0) ? 1 : data.Streak)));
        break;
    case 4:
        $("#stat2").text("XPM");
        $("#val2").text(Math.floor(data.XPM / ((data.Streak == 0) ? 1 : data.Streak)));
        break;
    case 5:
        $("#stat2").text("Level");
        $("#val2").text(Math.floor(data.XPM / ((data.Streak == 0) ? 1 : data.Streak)));
    }
    //show back if was hidden
    if (now2 != ch2) {
        $('#block2').css({opacity: 0.0, visibility: "visible"}).animate({opacity: 1.0});
    }
    
    //now work with block3
    var ch3 = choice[2];
    txt = $("#stat3").text();
    var now3;
    switch (txt) {
        case "Streak":
            now3 = 0;
            break;
        case "Kills":
            now3 = 1;
            break;
        case "Deaths":
            now3 = 2;
            break;
        case "GPM":
            now3 = 3;
            break;
        case "XPM":
            now3 = 4;
            break;
        case "Level":
            now3 = 5;
            break;
    }
    if (now3 != ch3) {
        //make invisible while putting data in
        $('#block3').css({opacity: 1.0, visibility: "visible"}).animate({opacity: 0}, 600);
    }
    //else just change data
    switch(ch3) {
    case 0:
        $("#stat3").text("Streak");
        $("#val3").text(data.Streak);
        break;
    case 1:
        $("#stat3").text("Kills");
        $("#val3").text(data.Kills);
        break;
    case 2:
        $("#stat3").text("Deaths");
        $("#val3").text(data.Deaths);
        break;
    case 3:
        $("#stat3").text("GPM");
        $("#val3").text(Math.floor(data.GPM / ((data.Streak == 0) ? 1 : data.Streak)));
        break;
    case 4:
        $("#stat3").text("XPM");
        $("#val3").text(Math.floor(data.XPM / ((data.Streak == 0) ? 1 : data.Streak)));
        break;
    case 5:
        $("#stat3").text("Level");
        $("#val3").text(Math.floor(data.XPM / ((data.Streak == 0) ? 1 : data.Streak)));
    }
    //show back if was hidden
    if (now3 != ch3) {
        $('#block3').css({opacity: 0.0, visibility: "visible"}).animate({opacity: 1.0});
    }
}


    

