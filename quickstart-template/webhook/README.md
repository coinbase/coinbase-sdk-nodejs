# Quickstart template for Webhook App

This is a template repository for quickly getting started with a Webhook App,
which can be used for setting up Webhooks for listening to blockchain event notifications.

## Local Webhook App

To set up the template, run the following commands from this `webhook` folder:

```bash
npm install
npm run start-webhook-app
```

This command will set up a webhook app locally.

Once the local webhook app is setup, in another terminal window, you can test it with:

```bash
curl -X POST -H "Content-Type:application/json" -d '{"app": "webhook"}' http://localhost:3000/callback
```

## Public Webhook App

To setup a temporary public URL that points to this local webhook app,
you can use [Pinggy](https://pinggy.io/) or [ngrok](https://ngrok.com/) in another terminal window:

```bash
ssh -p 443 -R0:localhost:3000 -L4300:localhost:4300 qr@a.pinggy.io
```

You can also use [Vercel](https://vercel.com/), [webhook.site](https://webhook.site/) or other hosting solutions for your webhook app.

Once the public webhook app is setup, copy the URL provided and test it with:

```bash
curl -X POST -H "Content-Type:application/json" -d '{"app": "webhook"}' {url_copied_from_pinggy_io}/callback
```

This URL (ie Notification URL) can now be used to create Webhook either
via [CDP Portal](https://docs-cdp-onchain-data-preview.cbhq.net/developer-platform/docs/cdp-webhooks/)
or [Coinbase SDK](https://docs-cdp-onchain-data-preview.cbhq.net/coinbase-sdk/docs/webhooks).
