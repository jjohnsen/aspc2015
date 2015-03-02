using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;
using System.Net.Sockets;
using System.Threading;
using System.Drawing;
using SpheroNET;
using RedCorona.Net;

namespace SpheroTest
{
    class Program
    {
        static Sphero sphero = null;

        private static IEnumerable<string> GetOrbBasicLinesFromFile(string filePath)
        {
            var rawLines = File.ReadLines(filePath, Encoding.UTF8);
            var result = new List<string>();
            foreach(var line in rawLines)
            { 
                 if (!string.IsNullOrEmpty(line) && line[0] != '\'')
                 {
                     result.Add(line + "\r");
                 }
            }
            return result;
        }

        static void Main(string[] args)
        {
            SpheroConnector spheroConnector = new SpheroConnector();

            spheroConnector.Scan();
            var deviceNames = spheroConnector.DeviceNames;
            int id = -1;

            for (int i = 0; i < deviceNames.Count; i++)
            { 
                Console.WriteLine("{0}: {1}", i, deviceNames[i]);
                if (deviceNames[i].Equals("Sphero-BPR"))
                {
                    id = i;
                    Console.WriteLine("FOUND ONE!!!!");  
                }
            }

            if (id >= 0)
            {
                sphero = spheroConnector.Connect(id);

                Console.WriteLine("CONNECTED");
            }

            var server = new Server();
            server.start();
        
            Console.ReadKey();
        }

        public static void Blink()
        {
            byte r, g, b;
            g = 0;
            b = 0;
            for (byte i = 0; i < 50; i++)
            {
                if (i % 2 == 0) {
                    r = 255;
                }
                else
                {
                    r = 0;
                }
                sphero.SetRGBLEDOutput(r, g, b);
                Thread.Sleep(200);
            }
        }
    }

    public class Server
    {
        public void start()
        {
            var server = new RedCorona.Net.Server(9090);
            var filereder = new MyHandler();

            HttpServer http = new HttpServer(server);
            http.Handlers.Add(filereder);
        }
    }

    public class MyHandler : SubstitutingFileReader
    {
        public override string GetValue(HttpRequest req, string tag)
        {
            Console.WriteLine("OMG");
            return base.GetValue(req, tag);
        }

        public override bool Process(HttpServer server, HttpRequest request, HttpResponse response)
        {
            Program.Blink();
            return false;
        }
    }
}
