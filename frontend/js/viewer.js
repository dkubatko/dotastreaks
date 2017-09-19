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
      //repetetive function that asks EBS for updates
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

//const colors for borders
var goodStats = "rgb(102, 255, 153)"
var regStats = "rgb(139, 0, 0)"

//const speed for fading
var slow = 600
var wait = 500

function trackData(data) {
    var val;
    var border = [false, false, false]
    
    var choice = [];
    var count = 0;
    //get ids with 
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
    
    //now work with block2
    var ch2 = choice[1];
    txt = $("#stat2").text();
    var now2 = getIdByText(txt);
    
    //now work with block3
    var ch3 = choice[2];
    txt = $("#stat3").text();
    var now3 = getIdByText(txt);

    if (now1 != ch1) {
        //make invisible while putting data in
        $('#block1').css({visibility: "visible"}).animate({opacity: 0}, slow);
    }
    
    if (now2 != ch2) {
        //make invisible while putting data in
        $('#block2').css({visibility: "visible"}).animate({opacity: 0}, slow);
    }
    
    if (now3 != ch3) {
        //make invisible while putting data in
        $('#block3').css({visibility: "visible"}).animate({opacity: 0}, slow);
    }
    
    //if same label
    if (now1 == ch1) {
        val = getDataById(ch1, data);
        if (val != $("#val1").text()) {
            //if data going to be changed, hide val block
            $("#val1").css({visibility: "visible"}).animate({opacity: 0}, slow);
            border[0] = true;
        }
    }
    
    //if same label
    if (now2 == ch2) {
        val = getDataById(ch2, data);
        //if not same data
        if (val != $("#val2").text()) {
            //if data going to be changed, hide val block
            $("#val2").css({visibility: "visible"}).animate({opacity: 0}, slow);
            border[1] = true;
        }
    }
    
    //if same label
    if (now3 == ch3) {
        val = getDataById(ch3, data);
        //if not same data
        if (val != $("#val3").text()) {
            //if data going to be changed, hide val block
            $("#val3").css({visibility: "visible"}).animate({opacity: 0}, slow);
            border[2] = true;
        }
    }
    
    console.log(border)
     
    //put all the data inside the blocks
    putData(ch1, $("#stat1"), $("#val1"), border[0], data);
    putData(ch2, $("#stat2"), $("#val2"), border[1], data);
    putData(ch3, $("#stat3"), $("#val3"), border[2], data);
    
    //show back if was hidden
    $('#block1').css({visibility: "visible"}).animate({opacity: 1.0}, slow);
    
    //show back if was hidden
    $('#block2').css({visibility: "visible"}).animate({opacity: 1.0}, slow);
    
    //show back if was hidden
    $('#block3').css({visibility: "visible"}).animate({opacity: 1.0}, slow);
}

//puts data into appropriate field
function putData(ch, stat, val, border, data) {
    var toput;
    switch(ch) {
    case 0:
        toput = data.Streak;
        //change data when block disappeared
        setTimeout(function () {
            stat.text("Streak");
            val.text(toput);
        }, slow);
        //make borders appropriate color
        if (toput > 0) {
            //make visible if not yet then show border
            //check if we need to show border
            if (border) {
                //if yes, show
                $(val).css({visibility: "visible"}).animate({opacity: 1.0}, slow).delay(wait).animate({ borderColor: goodStats }, 'slow');
            } else {
                //wait until frames are done
                setTimeout(function () {
                    $(val).animate({ borderColor: goodStats }, 'slow');  
                }, wait + slow);
            }
        } else {
            //same here
            if (border) {
                $(val).css({visibility: "visible"}).animate({opacity: 1.0}, slow).delay(wait).animate({ borderColor: regStats }, 'slow');
            } else {
                //wait until frames are done
                setTimeout(function () {
                    $(val).animate({ borderColor: regStats }, 'slow');  
                }, wait + slow);  
            }
        }
        break;
    case 1:
        toput = data.Kills;
        setTimeout(function () {
            stat.text("Kills");
            val.text(toput);
        }, slow);
        if (toput > 10) {
            //make visible if not yet then show border
            //check if we need to show border
            if (border) {
                //if yes, show
                $(val).css({visibility: "visible"}).animate({opacity: 1.0}, slow).delay(wait).animate({ borderColor: goodStats }, 'slow');
            } else {
                //wait until frames are done
                setTimeout(function () {
                    $(val).animate({ borderColor: goodStats }, 'slow');  
                }, wait + slow);
            }
        } else {
            //same here
            if (border) {
                $(val).css({visibility: "visible"}).animate({opacity: 1.0}, slow).delay(wait).animate({ borderColor: regStats }, 'slow');
            } else {
                //wait until frames are done
                setTimeout(function () {
                    $(val).animate({ borderColor: regStats }, 'slow');  
                }, wait + slow);  
            }
        }
        break;
    case 2:
        toput = data.Deaths;
        setTimeout(function () {
            stat.text("Deaths");
            val.text(toput);
        }, slow);
        if (toput < 10) {
            //make visible if not yet then show border
            //check if we need to show border
            if (border) {
                //if yes, show
                $(val).css({visibility: "visible"}).animate({opacity: 1.0}, slow).delay(wait).animate({ borderColor: goodStats }, 'slow');
            } else {
                //wait until frames are done
                setTimeout(function () {
                    $(val).animate({ borderColor: goodStats }, 'slow');  
                }, wait + slow);
            }
        } else {
            //same here
            if (border) {
                $(val).css({visibility: "visible"}).animate({opacity: 1.0}, slow).delay(wait).animate({ borderColor: regStats }, 'slow');
            } else {
                //wait until frames are done
                setTimeout(function () {
                    $(val).animate({ borderColor: regStats }, 'slow');  
                }, wait + slow);  
            }
        }
        break;
    case 3:
        toput = Math.floor(data.GPM / ((data.Streak == 0) ? 1 : data.Streak));
        setTimeout(function () {
            stat.text("GPM");
            val.text(toput);
        }, slow);
        if (toput > 500) {
            //make visible if not yet then show border
            //check if we need to show border
            if (border) {
                //if yes, show
                $(val).css({visibility: "visible"}).animate({opacity: 1.0}, slow).delay(wait).animate({ borderColor: goodStats }, 'slow');
            } else {
                //wait until frames are done
                setTimeout(function () {
                    $(val).animate({ borderColor: goodStats }, 'slow');  
                }, wait + slow);
            }
        } else {
            //same here
            if (border) {
                $(val).css({visibility: "visible"}).animate({opacity: 1.0}, slow).delay(wait).animate({ borderColor: regStats }, 'slow');
            } else {
                //wait until frames are done
                setTimeout(function () {
                    $(val).animate({ borderColor: regStats }, 'slow');  
                }, wait + slow);  
            }
        }
        break;
    case 4:
        toput = Math.floor(data.XPM / ((data.Streak == 0) ? 1 : data.Streak));
        setTimeout(function () {
            stat.text("XPM");
            val.text(toput);
        }, slow);
        if (toput > 500) {
            //make visible if not yet then show border
            //check if we need to show border
            if (border) {
                //if yes, show
                $(val).css({visibility: "visible"}).animate({opacity: 1.0}, slow).delay(wait).animate({ borderColor: goodStats }, 'slow');
            } else {
                //wait until frames are done
                setTimeout(function () {
                    $(val).animate({ borderColor: goodStats }, 'slow');  
                }, wait + slow);
            }
        } else {
            //same here
            if (border) {
                $(val).css({visibility: "visible"}).animate({opacity: 1.0}, slow).delay(wait).animate({ borderColor: regStats }, 'slow');
            } else {
                //wait until frames are done
                setTimeout(function () {
                    $(val).animate({ borderColor: regStats }, 'slow');  
                }, wait + slow);  
            }
        }
        break;
    case 5:
        toput = Math.floor(data.Lvl / ((data.Streak == 0) ? 1 : data.Streak));
        setTimeout(function () {
            stat.text("Level");   
            val.text(toput);
        }, slow);
        if (toput > 20) {
            //make visible if not yet then show border
            //check if we need to show border
            if (border) {
                //if yes, show
                $(val).css({visibility: "visible"}).animate({opacity: 1.0}, slow).delay(wait).animate({ borderColor: goodStats }, 'slow');
            } else {
                //wait until frames are done
                setTimeout(function () {
                    $(val).animate({ borderColor: goodStats }, 'slow');  
                }, wait + slow);
            }
        } else {
            //same here
            if (border) {
                $(val).css({visibility: "visible"}).animate({opacity: 1.0}, slow).delay(wait).animate({ borderColor: regStats }, 'slow');
            } else {
                //wait until frames are done
                setTimeout(function () {
                    $(val).animate({ borderColor: regStats }, 'slow');  
                }, wait + slow);  
            }
        }
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

function getDataById(id, data) {
    switch (id) {
        case 0:
            return data.Streak;
            break;
        case 1:
            return data.Kills;
            break;
        case 2:
            return data.Deaths;
            break;
        case 3:
            return Math.floor(data.GPM / ((data.Streak == 0) ? 1 : data.Streak));
            break;
        case 4:
            return Math.floor(data.XPM / ((data.Streak == 0) ? 1 : data.Streak));
            break;
        case 5:
            return Math.floor(data.Lvl / ((data.Streak == 0) ? 1 : data.Streak));
            break;
    }
}