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
      console.log(auth.channelId)
  });
}


$(document).ready(function() {
    (function update() {
      var data = {
                "channel_id": Gauth.channelId
            };
       $.ajax({
            url: 'https://dotastreaks.com/userUpdate',
            type: 'POST',
            headers: {
                'x-extension-jwt': Gauth.token
            },
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            data: JSON.stringify(data),
            success: function(data) {
              console.log(data);
            },
            complete: function() {
              // Schedule the next request when the current one's complete
              setTimeout(update, 5000);
            }
        }); 
    })();
});

