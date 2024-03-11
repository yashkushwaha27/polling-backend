const express = require("express");
const http = require("http");
const cors = require("cors");

const { appConstants } = require("./src/constants/appConstants");
const { initiateServer } = require("./src/socket/socket");

const app = express();
const server = http.createServer(app);

const { json, urlencoded } = express;
const corsOptions = {
  origin: "*",
};

app.use(json());
app.use(urlencoded({ extended: true }));
app.use(cors(corsOptions));

// Initiating socket.io server
initiateServer(server);

app.get("/", (_, res) => res.status(200).send({ status: true, working: true }));

server.listen(appConstants.port, () =>
  console.log(`Server started on http://localhost:${appConstants.port}`)
);
