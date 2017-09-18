/*
Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

    http://aws.amazon.com/apache2.0/

or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/*

  Set Javascript specific to the extension viewer view in this file.

*/

var Gauth;
if (window.Twitch.ext) {
  window.Twitch.ext.onAuthorized(function(auth) {
      Gauth = auth;
      
      (function update() {
        var data = {
                "channel_id": auth.channelId
            };
        console.log(data)
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
    //get rid of non-tracked data
    if (!data.Choice[0]) {
      $("#block1").fadeOut("slow");
    } else {
      $("#block1").fadeIn("slow");
    }
    if (!data.Choice[1]) {
      $("#block2").fadeOut("slow");
    } else {
      $("#block2").fadeIn("slow");
    }
    if (!data.Choice[2]) {
      $("#block3").fadeOut("slow");
    } else {
      $("#block3").fadeIn("slow");
    }
    if (!data.Choice[3]) {
      $("#block4").fadeOut("slow");
    } else {
      $("#block4").fadeIn("slow");
    }
    if (!data.Choice[4]) {
      $("#block5").fadeOut("slow");
    } else {
      $("#block5").fadeIn("slow");
    }
    if (!data.Choice[5]) {
      $("#block6").fadeOut("slow");
    } else {
      $("#block6").fadeIn("slow");
    }
    //now track data
    $("#val1").text(data.Streak);
    if (data.Streak > 0) {
        $("#val1").animate({borderColor: goodStats}, "slow");
    } else {
        $("#val1").animate({borderColor: regStats}, "slow");
    }

    $("#val2").text(data.Kills);
    if (data.Kills > 10) {
        $("#val2").animate({borderColor: goodStats}, "slow");
    } else {
        $("#val2").animate({borderColor: regStats}, "slow");
    }
    
    $("#val3").text(data.Deaths);
    if (data.Deaths < 5) {
        $("#val3").animate({borderColor: goodStats}, "slow");
    } else {
        $("#val3").animate({borderColor: regStats}, "slow");
    }
    
    $("#val4").text(Math.floor(data.GPM / (data.Streak == 0) ? 1 : data.Streak));
    if (data.GPM > 500) {
        $("#val4").animate({borderColor: goodStats}, "slow");
    } else {
        $("#val4").animate({borderColor: regStats}, "slow");
    }
    
    $("#val5").text(Math.floor(data.XPM / (data.Streak == 0) ? 1 : data.Streak));
    if (data.XPM > 500) {
        $("#val5").animate({borderColor: goodStats}, "slow");
    } else {
        $("#val5").animate({borderColor: regStats}, "slow");
    }
    
    $("#val6").text(Math.floor(data.Level / (data.Streak == 0) ? 1 : data.Streak));
    if (data.Level > 20) {
        $("#val6").animate({borderColor: goodStats}, "slow");
    } else {
        $("#val6").animate({borderColor: regStats}, "slow");
    }
}


    

