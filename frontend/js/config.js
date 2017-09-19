/*
Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

    http://aws.amazon.com/apache2.0/

or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/*

  Set Javascript specific to the extension configuration view in this file.

*/


var pressedColor = "rgb(102, 255, 153)"
var unpressedColor = "rgb(255, 255, 255)"

//if you see this: I am desperately looking
//for internships. :x

$(document).ready(function (){
    //set up all buttons to have unpressed color
    var buttons = document.getElementsByClassName("defbtn");
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].style.backgroundColor = unpressedColor
    }
    //simply remove done button and show loading img
    $("#done").click(function() {
        sendSteamID();
        $("#res").slideUp("50");
        $("#loading").slideDown("slow");
    });
    
    //count number of buttons pressed
    var count = 0
    
    $(".defbtn").click(function() {
        var clr = $(this).css("backgroundColor")
        if (clr == unpressedColor && count < 3) {
            $(this).animate({backgroundColor: pressedColor}, "fast");
            count++;
        } else if (clr == pressedColor) {
            $(this).animate({backgroundColor: unpressedColor}, "fast");
            count--;
        }
        //do nothing if count == 3
    });
    
    //handle complete button
    $("#complete").click(function() {
        var data = {
                "channel_id": Gauth.channelId,
                "choice": [false, false, false,
                          false, false, false]
            };
        
        var clr = [];
        //get all buttons color and find pressed ones
        var buttons = document.getElementsByClassName("defbtn");
        //JQuery didnt give me any result for some reason
        for (var i = 0; i < buttons.length; i++) {
            clr[i] = buttons[i].style.backgroundColor;
            if (clr[i] != unpressedColor) {
                data.choice[i] = true;
            } else {
                $(buttons[i]).animate({ opacity: 0.25 }, 1000);
            }
        }
       
        $.ajax({
            url: 'https://dotastreaks.com/config',
            type: 'POST',
            headers: {
                'x-extension-jwt': Gauth.token
            },
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            complete: function() {
                $("#complete").fadeOut("slow");
                $("#last").delay(700).fadeIn("slow");
            },
            data: JSON.stringify(data),
        }); 
    });
});

function sendSteamID() {
    //close result before showing new one
    $("#res").slideUp(300);
    
    var account_id = document.getElementById('inp').value;
    var data = {
                "account_id": account_id,
                "client_id": Gauth.clientId,
                "channel_id": Gauth.channelId
            };
    $.ajax({
            url: 'https://dotastreaks.com/verify',
            type: 'POST',
            headers: {
                'x-extension-jwt': Gauth.token
            },
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            data: JSON.stringify(data),
            success: function(data) {
                successVerify(data);        
            },
            error: function() {
                notSuccess()
            }
        });
}

function successVerify(data) {
    $("#loading").slideUp("slow");
    if (data.Response == "ok") {
        $("#resimg").delay(100).attr("src", "https://dotastreaks.com/images/ok.png");
        $("#res").delay(1000).slideDown("slow");
        $("#done").delay(2000).fadeOut(400)
        $("#second").delay(2600).fadeIn(600);
    } else if (data.Response == "err") {
        $("#resimg").attr("src", "https://dotastreaks.com/images/error.png");
        $("#res").delay(1000).slideDown("slow");
    }
}

function notSuccess() {
    $("#loading").slideUp("slow");
}