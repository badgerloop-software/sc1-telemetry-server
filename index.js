import express from "express";
import { createServer } from "http";
import BLOOP_ROUTER from "./bloop_api.js";

const PORT = 3000;
const APP = express();

APP.use(BLOOP_ROUTER);


const SERVER = createServer(APP);

SERVER.listen(PORT, () => console.log(`Listening on port ${PORT}`));

