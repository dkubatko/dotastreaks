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
        $("#loading").slideDown("slow");
    });
});

function sendSteamID() {
    var account_id =        document.getElementById('inp').value;
    var data = {
                "account_id": account_id,
                "client_id": Gauth.clientId
            }
    console.log(data);
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
                $("#loading").slideUp("slow");
                console.log(data);
            },
            error: function() {
                console.log("AJAX ERROR")
            }
        });
}