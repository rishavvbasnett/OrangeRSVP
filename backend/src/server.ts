import env from "./shared/config/env.js";
import app from "./app.js";

const PORT = env.PORT || 3000;

app.listen(PORT, () => console.log("Server listening to PORT ", PORT));
