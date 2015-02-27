using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.AspNet.SignalR;

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
    }
}