# CDP Webhooks Discord bot

This repo contains a bot that posts messages to Discord whenever you receive a message on your webhook.

More info on the docs: https://docs.cdp.coinbase.com/get-started/docs/webhooks/discord-bot-demo

## Prerequisites

You'll need:

- [CDP API Key](https://portal.cdp.coinbase.com/access/api)
- A [Discord webhook](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks) URL

## How to run

1. First install packages: `npm install`

2. Setup tunneling, using Pinggy: `npm run start-pinggy`

3. Copy .env.example into .env file on the same folder and replace the `DISCORD_URL` with your Discord webhook URL and `WEBHOOK_NOTIFICATION_URL` with your pinggy HTTPS URL from previous step.

4. Run your webhook server: `npm run start-server`

5. The last step is to execute the transfer using our SDK: `npm run start-transfer`

If everything was successful, after a few seconds, you should see the transfer event data being posted to your Discord channel.
