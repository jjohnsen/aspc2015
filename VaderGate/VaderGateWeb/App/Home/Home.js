/// <reference path="../App.js" />

(function () {
    "use strict";
    var list = [
        /may the force be with you/i,
        /i am your father/i,
        /password/i,
        /secret/i,
        /I’m not afraid/i,
        /Ready are you/i,
        /IT’S A TRAP/i,
        /Im your father/i,
        /I'm your father/i,
        /I’m your father/i
    ]
    // The initialize function must be run each time a new page is loaded
    Office.initialize = function (reason) {
        $(document).ready(function () {
            app.initialize();
            Office.context.document.addHandlerAsync(Office.EventType.DocumentSelectionChanged, MyHandler)
            $('#get-data-from-selection').click(getDataFromSelection);

            $('#About a').click(function () {
                $('#About').fadeOut();
            });
        });
    };

    function MyHandler(eventArgs) {
        //  doSomethingWithDocument(eventArgs.document);
        eventArgs.document;

        Office.context.document.getSelectedDataAsync(Office.CoercionType.Text,
         function (result) {
             if (result.status === Office.AsyncResultStatus.Succeeded) {
                 if (result.value != null && result.value != "") {
                     $("#selection .result").html();
                     $("#selection").fadeIn();
                     $("#help").fadeOut();

                     $("#selection .text").html(result.value);
                     $("#selection .result").html("");

                     var search = result.value;
                     var hit = false;

                     $(list).each( function(i, reg) {
                         var result = search.match(reg);
                         if (result != null) {
                             var text = $("<p>").html(result)
                             $("#selection .result").append(text);
                             hit = true;
                         }
                     });

                     if (hit) {
                         $("#selection .fail").fadeIn();
                         $("#selection .ok").hide();
                     } else {

                         $("#selection .ok").fadeIn();
                         $("#selection .fail").hide();
                     }
                 }
                 else {
                     $("#selection").fadeOut();
                     $("#selection .fail").fadeIn();
                     $("#selection .ok").fadeIn();
                     $("#help").fadeIn();
                 }
             }
         });
    }

    // Function that writes to a div with id='message' on the page.
    function write(message) {
        document.getElementById('message').innerText += message;
    }

    // Reads data from current document selection and displays a notification
    function getDataFromSelection() {
        
        Office.context.document.getSelectedDataAsync(Office.CoercionType.Text,
            function (result) {
                if (result.status === Office.AsyncResultStatus.Succeeded) {
                    app.showNotification('The selected text is:', '"' + result.value + '"');
                } else {
                    app.showNotification('Error:', result.error.message);
                }
            }
        );
    }
})();