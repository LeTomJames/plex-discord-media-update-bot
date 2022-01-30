const axios = require("axios");
const express = require("express");
const multer = require("multer");
const app = express();
const port = process.env.PORT || 3000;

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const upload = multer({ dest: "/tmp" });

// Do not start up express server if we do not have a DISCORD_WEBHOOK_URL
if (!DISCORD_WEBHOOK_URL) {
  console.log(
    "DISCORD_WEBHOOK_URL is not defined as an environment variable. Exiting..."
  );
  return;
}

// We all need a health check endpoint right?
app.get("/ping", (req, res) => {
  console.log("I AM ALIVE!");
  res.send("Pong");
});

app.post("/discord", upload.single("thumb"), (req, res, next) => {
  const payload = JSON.parse(req.body.payload);

  let discordPayload = { content: "No payload" };

  // We only care about new additions to the Plex Media Server
  if (payload.event == "library.new") {
    console.log("Processing data from Plex Media Server", payload);

    const type = payload.Metadata.type.toUpperCase();

    switch (type) {
      // New episodes added for Anime/TV Show/KDrama
      case "EPISODE":
        discordPayload = {
          content: `${type}: ${payload.Metadata.title} was added for ${payload.Metadata.grandparentTitle} (${payload.Metadata.year})\n`,
        };
        break;

      // New movie added
      default:
        discordPayload = {
          content: `${type}: ${payload.Metadata.title} (${payload.Metadata.year})\n`,
        };
    }

    axios
      .post(DISCORD_WEBHOOK_URL, discordPayload)
      .then(
        console
          .log("Payload:", discordPayload)
          .catch((error) => console.error(error))
      );
  }

  res.send(discordPayload);
});

app.listen(port, () =>
  console.log(`Plex Discord Bot app is listening on port ${port}...`)
);
