import "./shared/config/env.js";
import app from "./app.js";
import { connectDB } from "./shared/config/db.js";
import { PORT } from "./shared/config/env.js";

try {
  await connectDB();
  console.log("Connected to MongoDB");
} catch (error: unknown) {
  if (error instanceof Error) {
    console.log(`Connection to MongoDB failed: ${error.message}`);
  } else {
    console.log(`Unknown error occured`);
  }
}

app.listen(PORT, () => {
  console.log(`Server listening to PORT: ${PORT}`);
});
