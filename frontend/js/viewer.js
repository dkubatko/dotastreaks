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
    //get rid of non-tracked data
    //could be for-ized but I am not sure how
    if (data.Choice[0]) {
        if ($("#stat1").text != "Streak") {
            //hide element for a while
            $("#block1").css({opacity: 1.0, visibility: "visible"}).animate({opacity: 0}, 600);
            //now change data
            $("#stat1").text("Streak");
            $("val1").text(data.Streak)
            //show changed data
            $("#block1").css({opacity: 0.0, visibility: "visible"}).animate({opacity: 1.0});
            //show green or red frames
            if (data.Streak > 0) {
                $("#val1").animate({borderColor: goodStats}, "slow");
            } else {
                $("#val1").animate({borderColor: regStats}, "slow");
            }
        }
    }
    
    if (data.Choice[1]) {
        if ($("#stat1").text != "Kills") {
            //hide element for a while
            $("#block1").css({opacity: 1.0, visibility: "visible"}).animate({opacity: 0}, 600);
            //now change data
            $("#stat1").text("Kills");
            $("val1").text(data.Kills)
            //show changed data
            $("#block1").css({opacity: 0.0, visibility: "visible"}).animate({opacity: 1.0});
            //show green or red frames
            if (data.Kills > 10) {
                $("#val1").animate({borderColor: goodStats}, "slow");
            } else {
                $("#val1").animate({borderColor: regStats}, "slow");
            }
        }
    }
    
    if (data.Choice[2]) {
        if ($("#stat2").text != "Deaths") {
            //hide element for a while
            $("#block2").css({opacity: 1.0, visibility: "visible"}).animate({opacity: 0}, 600);
            //now change data
            $("#stat2").text("Deaths");
            $("val2").text(data.Deaths)
            //show changed data
            $("#block2").css({opacity: 0.0, visibility: "visible"}).animate({opacity: 1.0});
            //show green or red frames
            if (data.Deaths < 5) {
                $("#val2").animate({borderColor: goodStats}, "slow");
            } else {
                $("#val2").animate({borderColor: regStats}, "slow");
            }
        }
    }
    
    if (data.Choice[3]) {
        if ($("#stat2").text != "GPM") {
            //hide element for a while
            $("#block2").css({opacity: 1.0, visibility: "visible"}).animate({opacity: 0}, 600);
            //now change data
            $("#stat2").text("GPM");
            $("val2").text(Math.floor(data.GPM / ((data.Streak == 0) ? 1 : data.Streak)))
            //show changed data
            $("#block2").css({opacity: 0.0, visibility: "visible"}).animate({opacity: 1.0});
            //show green or red frames
            if (Math.floor(data.GPM / ((data.Streak == 0) ? 1 : data.Streak)) > 500) {
                $("#val2").animate({borderColor: goodStats}, "slow");
            } else {
                $("#val2").animate({borderColor: regStats}, "slow");
            }
        }
    }
    
    if (data.Choice[4]) {
        if ($("#stat3").text != "XPM") {
            //hide element for a while
            $("#block3").css({opacity: 1.0, visibility: "visible"}).animate({opacity: 0}, 600);
            //now change data
            $("#stat3").text("XPM");
            $("val3").text(Math.floor(data.XPM / ((data.Streak == 0) ? 1 : data.Streak)))
            //show changed data
            $("#block3").css({opacity: 0.0, visibility: "visible"}).animate({opacity: 1.0});
            //show green or red frames
            if (Math.floor(data.XPM / ((data.Streak == 0) ? 1 : data.Streak)) > 500) {
                $("#val3").animate({borderColor: goodStats}, "slow");
            } else {
                $("#val3").animate({borderColor: regStats}, "slow");
            }
        }
    }
    
    if (data.Choice[5]) {
        if ($("#stat3").text != "Level") {
            //hide element for a while
            $("#block3").css({opacity: 1.0, visibility: "visible"}).animate({opacity: 0}, 600);
            //now change data
            $("#stat3").text("Level");
            $("val3").text(Math.floor(data.XPM / ((data.Streak == 0) ? 1 : data.Streak)))
            //show changed data
            $("#block3").css({opacity: 0.0, visibility: "visible"}).animate({opacity: 1.0});
            //show green or red frames
            if (Math.floor(data.Lvl / ((data.Streak == 0) ? 1 : data.Streak)) > 500) {
                $("#val3").animate({borderColor: goodStats}, "slow");
            } else {
                $("#val3").animate({borderColor: regStats}, "slow");
            }
        }
    }
}


    

