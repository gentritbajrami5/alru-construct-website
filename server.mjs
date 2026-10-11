import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 4173;
const CONTACT_EMAIL = "alruconstruct@gmail.com";

const app = express();
app.disable("x-powered-by");
app.use(express.static(__dirname));

app.get("/api/config", (_req, res) => {
  res.json({ email: CONTACT_EMAIL });
});

app.listen(PORT, () => {
  console.log("Alru Construct lokaal: http://127.0.0.1:" + PORT);
});
