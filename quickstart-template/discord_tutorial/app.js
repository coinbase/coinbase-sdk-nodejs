import "dotenv/config";
import express from 'express'
import axios from 'axios'

const app = express();
app.use(express.json());

app.post("/", (req, res) => {
  const discordWebhookUrl = process.env.DISCORD_URL;
  
  const data = req.body;

  if (!discordWebhookUrl) {
    console.log('DISCORD_URL is missing from env file.');
    return;
  }

  let messageContent = 'A new ' + data.eventType + ' event was received from the webhook: \n```'
  messageContent += JSON.stringify(data, null, 2)
  messageContent += '```\n'
  messageContent += `Data received at ${new Date().toLocaleString("en-US")}`

  const postData = {
    content: messageContent,
  }
  axios.post(discordWebhookUrl, postData).then(() => console.log('Successfully called discord.')).catch(console.log);

  res.sendStatus(200);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
