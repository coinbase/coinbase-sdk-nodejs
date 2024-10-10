# Quickstart template for Webhook App

This is a template repository for quickly getting started with a Webhook App,
which can be used for setting up Webhooks for listening to blockchain event notifications.

## Public Webhook App

You can use [webhook.site](https://webhook.site/) or [Vercel](https://vercel.com/) or other hosting solutions to create a simple webapp with public facing URL which can receive data from webhook POST calls.

Once the public webapp is setup, copy the URL provided and test it locally. Below is an example from webhook.site:

```bash
curl -X POST 'https://webhook.site/00000000-0000-0000-0000-000000000000' \
  -H 'content-type: application/json' \
  -d $'{"id": 7, "name": "Jack Daniels", "position": "Assistant"}'
```

This URL (ie Notification URL) can now be used to create Webhook either
via [CDP Portal](https://docs-cdp-onchain-data-preview.cbhq.net/developer-platform/docs/cdp-webhooks/)
or [Coinbase SDK](https://docs-cdp-onchain-data-preview.cbhq.net/coinbase-sdk/docs/webhooks).
