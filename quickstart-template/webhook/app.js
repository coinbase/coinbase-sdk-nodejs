const express = require("express");
const app = express();

app.use(express.json());

app.post("/callback", (req, res) => {
  // here's what you'll expect to receive depending on the event type
  // https://docs.cdp.coinbase.com/onchain-data/docs/webhooks#event-types
  const data = req.body;

  console.log("Headers received:");
  console.log(JSON.stringify(req.headers, null, 4));
  console.log("Body received:");
  console.log(JSON.stringify(data, null, 4));

  const response = {
    message: "Data received",
    received_data: data,
  };
  res.json(response);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
