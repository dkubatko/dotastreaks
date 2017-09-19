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
    var now1 = getIdByText(txt);

    if (now1 != ch1) {
        //make invisible while putting data in
        $('#block1').css({visibility: "visible"}).animate({opacity: 0}, 600);
    }
        
    putData(ch1, $("#stat1"), $("#val1"), data);
    //show back if was hidden
    $('#block1').css({visibility: "visible"}).animate({opacity: 1.0});
    
    
    //now work with block2
    var ch2 = choice[1];
    txt = $("#stat2").text();
    var now2 = getIdByText(txt);
    
    console.log(now2)
    console.log(ch2)
    console.log(now2 != ch2)
    if (now2 != ch2) {
        //make invisible while putting data in
        $('#block2').css({visibility: "visible"}).animate({opacity: 0}, 600);
    }
    
    putData(ch2, $("#stat2"), $("#val2"), data);
    
    //show back if was hidden
    $('#block2').css({visibility: "visible"}).animate({opacity: 1.0});
    
    //now work with block3
    var ch3 = choice[2];
    txt = $("#stat3").text();
    var now3 = getIdByText(txt);
    
    console.log(now3)
    console.log(ch3)
    console.log(now3 != ch3)
    if (now3 != ch3) {
        //make invisible while putting data in
        $('#block3').css({visibility: "visible"}).animate({opacity: 0}, 600);
    }
    
    putData(ch3, $("#stat3"), $("val3"), data);
    
    //show back if was hidden
    $('#block3').css({visibility: "visible"}).animate({opacity: 1.0});
}


function putData(ch, stat, val, data) {
    switch(ch) {
    case 0:
        stat.delay(600).text("Streak");
        val.delay(600).text(data.Streak);
        break;
    case 1:
        stat.delay(600).text("Kills");
        val.delay(600).text(data.Kills);
        break;
    case 2:
        stat.delay(600).text("Deaths");
        val.delay(600).text(data.Deaths);
        break;
    case 3:
        stat.delay(600).text("GPM");
        val.delay(600).text(Math.floor(data.GPM / ((data.Streak == 0) ? 1 : data.Streak)));
        break;
    case 4:
        stat.delay(600).text("XPM");
        val.delay(600).text(Math.floor(data.XPM / ((data.Streak == 0) ? 1 : data.Streak)));
        break;
    case 5:
        stat.delay(600).text("Level");
        val.delay(600).text(Math.floor(data.XPM / ((data.Streak == 0) ? 1 : data.Streak)));
    }
}

function getIdByText(txt) {
    switch (txt) {
        case "Streak":
            return 0;
            break;
        case "Kills":
            return 1;
            break;
        case "Deaths":
            return 2;
            break;
        case "GPM":
            return 3;
            break;
        case "XPM":
            return 4;
            break;
        case "Level":
            return 5;
            break;
    }
}