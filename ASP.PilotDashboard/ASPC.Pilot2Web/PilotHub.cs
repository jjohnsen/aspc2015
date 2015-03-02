using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.AspNet.SignalR;
using Microsoft.ServiceBus.Notifications;
using System.Net;

namespace ASPC.Pilot2Web
{
    public class PilotHub : Hub
    {
        public void Hello()
        {
            Clients.All.hello();
        }

        public void Send(string pilotId, string pilotName, string shipTitle, float lat, float lng) {
            Clients.All.addNewMessageToPage(pilotId, pilotName, shipTitle, lat, lng);
        }

        public void SendDistressSignal(string message)
        {
            NotificationHubClient hub = NotificationHubClient.CreateClientFromConnectionString("Endpoint=sb://multiconsult-skydriveprep.servicebus.windows.net/;SharedAccessKeyName=DefaultFullSharedAccessSignature;SharedAccessKey=4v+KZgVKG6X3MX9BvA8/nY6Q2HXHkR+qSYA2rmM5kSs=", "skillwizardsnotificationhub");
            hub.SendGcmNativeNotificationAsync("{ \"data\" : {\"msg\":\"" + message + "\"}}");
            try
            {
                var request = (HttpWebRequest)WebRequest.Create("http://localhost:9090/testing");
                request.GetResponse();
            }
            catch (Exception e)
            {

            }

        }
    }
}