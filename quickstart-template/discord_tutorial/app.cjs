require("dotenv/config");
const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
const jsonParser = bodyParser.json();

app.get("/", jsonParser, (req, res) => {
  res.send("Your https server is working!");
});

app.post("/", jsonParser, (req, res) => {
  if (!process.env.DISCORD_URL) {
    console.log("DISCORD_URL is missing from env");
    res.sendStatus(400);
    return;
  }

  const data = req.body;

  let messageContent = "A new " + data.eventType + " event was received from the webhook: \n```";
  messageContent += JSON.stringify(data, null, 2);
  messageContent += "```\n";
  messageContent += `Data received at ${new Date().toLocaleString("en-US")}`;

  const postData = {
    content: messageContent,
  };
  axios
    .post(process.env.DISCORD_URL, postData)
    .then(() => {
      console.log("Successfully posted message to discord");
      res.sendStatus(200);
    })
    .catch(e => {
      console.error(e);
      res.sendStatus(400);
    });
});

app.listen(5000, () => {
  console.log("Running on port 5000.");
});

module.exports = app;
