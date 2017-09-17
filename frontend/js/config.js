/*
Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

    http://aws.amazon.com/apache2.0/

or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/*

  Set Javascript specific to the extension configuration view in this file.

*/

function sendSteamID() {
    var account_id =        document.getElementById('inp').value;
    $.ajax({
            url: 'https://localhost:8080/verify',
            type: 'POST',
            headers: {
                'x-extension-jwt': Gauth.token
            },
            dataType: 'json',
            data: {
                account_id: account_id,
                client_id: Gauth.clientId
            },
            success: function(data) {
                console.log(data)
            },
            error: function() {
                console.log("error")
            }
        });   
}

function show_loading() {
    var x = document.getElementById('loading');
    if (x.style.display === 'none') {
        x.style.display = 'block';
        sendSteamID();
    } else {
        x.style.display = 'none';
    }
}