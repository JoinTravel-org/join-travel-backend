import { createServer } from "http";
import app from "./app.js";
import config from "./config/index.js";

import connectDB from "./load/database.loader.js";
const server = createServer(app);

const PORT = config.port;
await connectDB()

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
