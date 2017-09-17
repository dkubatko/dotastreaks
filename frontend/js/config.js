/*
Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

    http://aws.amazon.com/apache2.0/

or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/*

  Set Javascript specific to the extension configuration view in this file.

*/

$(document).ready(function(){
    $("#done").click(function() {
        $("#res").slideUp("50");
        $("#loading").slideDown("slow");
    });
    
    $(".defbtn").click(function() {
        var clr = $(this).css("background-color")
        console.log(clr)
        if (clr == "rgb(255, 255, 255)") {
            $(this).animate({backgroundColor: "rgb(102, 255, 153)"}, "slow");
        } else if (clr == "rgb(102, 255, 153)") {
            $(this).animate({backgroundColor: "white"}, "slow");
        }
    });
});

function sendSteamID() {
    //close result before showing new one
    $("#res").slideUp(300);
    
    var account_id =        document.getElementById('inp').value;
    var data = {
                "account_id": account_id,
                "client_id": Gauth.clientId
            }
    $.ajax({
            url: 'https://localhost:8080/verify',
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