# Pump Application
Purpose:
    This application is meant to control pumps that are connected to a rasberry pi via serial communication. Also, there is a servo motor that is being controlled via rasberry pi pins. The end user
    Should be able to dictate flow rate as well as syringe diameter, via a ui that is communicating with a server that is then delegating the commands to the appropriate channel for the pumps.

File Contents:

    -./server/bin/www
        Entry point for the server process. This file is resposible for communitcating most directly with the node process to ensure that the host machine is listening on certain ports for communication.
        The code delegates to the app object, which is an express object, and that is to handle routing of the http communication to appropriate handling code. Lastly, this file handles communication with the sequelize library,
        which in turn processes files under the models folder and creates the appropriate sql tables.

    -./server/app.js
        Represents the express object. This object is received as a parameter to the node http server object (simple handling of communication on certain port), and adds logic for static file serving, as well as routing. This can be added on to with
        middleware, or libraries that hook into the http request-response processing. The routing for the rest api in this case is delegated to the /routes/index.js file.

    -./server/routes/index.js
        Where most of the app business logic is kept, this file contains the rest api endpoints and the code that should execute when receiving an http request on that route. Most of the routes handle adding and removing of pumps and pumpmodes. There are also
        endpoints to start and stop pumps, these endpoints in turn delegate to the serialBus object which handles direct communication with the pump drivers via the raspberry pi serial port.

    -./server/serialBus.js
        This file is used to communicate directly with the pump drivers via the serialport. It is also used to setup a pipeline for recieving messages from the pi and sending them directly to the client via an open tcp socket, provided by socket.io library.

    -./server/views/index.jade
        This file is served via the index.js file on the "/" route (home page). The file is a jade file which provides an html templating syntax, based upon data that is exposed to it via the js in index.js.

    -./server/views/layout.jade
        This file describes a general styling of content for each jade file that is served up. In this case, since there is only one jade file being served up (index.jade) it is there mostly for extensibility. Also, it declares our client-side dependencies
        via a descriptor for what should be in the head element of each jade/html file served up.

    -./server/public/ui.js
        This is where all of our client-side javascript is. It handles the interception of user activities and their translation to server side processes, as well as the processing of the server's response if applicable. Lastly, the socket.io library is utilized to handle communication
        over an open tcp connection with the js in serialBus.js, so that updates from the pump driver that are received asynchronously can easily be made available to the client.

    -./server/models/**
        Files that are used to construct our db tables and provide an orm abstraction, so that we can simply treat tables as objects that have method accessors, which in turn translate to the respective sql that elicits the actions advertised by the object method.

    -./packages.json
        File that is interpereted by the npm process (node package manager). There are "scripts" within this file, that are aliases to commands that should be run against the node process to start the application.

Debug Mode:
    In order to debug, we must use node-inspector. Node-inspector is already installed on the pi as a globally accessible command. Open up a terminal and run the following command: sudo node-insepctor. In another terminal cd into the directory that the app is installed in and run the following
    command: npm run debug. You should now be able to open your browser to the following: <ipOfPi>:8080/debug?port=5858. You should now have access to the server-side files and can set break points where you like. Note: I have run into some typeError issues from time to time that cause the application 
    to crash. In the future, a move to the latest node should be considered, as it has a built-in debugger functionality that might be more robust. 
    
Usage:
    In order to use the application in regular end user mode one must simply input the following on the command line: npm run start. In order to start the application in admin mode, where an end user can administrate over
    pumps and run modes, one must enter the following on the command line: npm run admin

