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

$(document).ready(function (){
    //set up all buttons to have unpressed color
    document.getElementsByClassName("defbtn")[0].style.backgroundColor = unpressedColor
    document.getElementsByClassName("defbtn")[1].style.backgroundColor = unpressedColor
    document.getElementsByClassName("defbtn")[2].style.backgroundColor = unpressedColor
    $("#done").click(function() {
        $("#res").slideUp("50");
        $("#loading").slideDown("slow");
    });
    
    $(".defbtn").click(function() {
        var clr = $(this).css("backgroundColor")
        if (clr == unpressedColor) {
            $(this).animate({backgroundColor: pressedColor}, "slow");
        } else if (clr == pressedColor) {
            $(this).animate({backgroundColor: unpressedColor}, "slow");
        }
    });
    
    $("#complete").click(function() {
        var data = {
                "channel_id": Gauth.channelId,
                "choice": [false, false, false]
            };
        
        var clr1 = document.getElementsByClassName("defbtn")[0].style.backgroundColor;
        var clr2 = document.getElementsByClassName("defbtn")[1].style.backgroundColor;
        var clr3 = document.getElementsByClassName("defbtn")[2].style.backgroundColor;
        
        console.log(clr1);
        console.log(clr2);
        console.log(clr3);
        
        if (clr1 != unpressedColor) {
            data.choice[0] = true
        }
        
        if (clr2 != unpressedColor) {
            data.choice[1] = true
        }
        
        if (clr3 != unpressedColor) {
            data.choice[2] = true
        }
        
        console.log(JSON.stringify(data))
       
        $.ajax({
            url: 'https://dotastreaks.com/config',
            type: 'POST',
            headers: {
                'x-extension-jwt': Gauth.token
            },
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
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
                SuccessVerify(data);        
            },
            error: function() {
                console.log("AJAX ERROR")
            }
        });
}

function SuccessVerify(data) {
    $("#loading").slideUp("slow");
    if (data.Response == "ok") {
        $("#resimg").delay(100).attr("src", "/images/ok.png");
        $("#res").delay(1000).slideDown("slow");
        $("#done").delay(2000).fadeOut(400)
        $("#second").delay(2600).fadeIn(600);
    } else if (data.Response == "err") {
        $("#resimg").attr("src", "/images/error.png");
        $("#res").delay(1000).slideDown("slow");
    }
}