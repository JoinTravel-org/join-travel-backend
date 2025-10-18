import { createServer } from "http";
import app from "./app.js";
import config from "./config/index.js";

const server = createServer(app);

const PORT = config.port;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
