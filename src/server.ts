/* eslint-disable import/first */

import dotenv from "dotenv";
dotenv.config();

import { server } from "./socket";

const port = process.env.PORT ?? 3001;

server.listen(port, () => { console.log(`Listening on port ${port}`); });
