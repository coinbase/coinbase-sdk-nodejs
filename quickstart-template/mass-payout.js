import { Coinbase } from "@coinbase/coinbase-sdk";
import { createArrayCsvWriter } from "csv-writer";
import os from "os";
import fs from "fs";
import { parse } from "csv-parse";

// CREATE RECEIVING WALLETS
async function createReceivingWallets(user) {
  // Create 5 receiving wallets and only store wallet addresses
  const addresses = [];

  for (let i = 1; i <= 5; i++) {
    let receivingWallet = await user.createWallet();
    console.log(`Receiving Wallet${i} successfully created: `, receivingWallet.toString());

    let receivingAddress = receivingWallet.getDefaultAddress();
    console.log(`Default address for Wallet${i}: `, receivingAddress.getId());
    addresses.push([receivingAddress.getId()]); // Storing address as an array
  }

  return addresses;
}

// WRITE TO CSV FILE WITH RECEIVING WALLET ADDRESSES
async function writeReceivingAddressesToCsv(addresses) {
  // Define CSV file
  const csvWriter = createArrayCsvWriter({
    path: "wallet-array.csv",
    header: false,
  });

  // Write wallet addresses to CSV file
  await csvWriter.writeRecords(addresses);
  console.log("The CSV file was written successfully without headers.");
}

// CREATE AND FUND A SENDING WALLET
async function createAndFundSendingWallet(user) {
  // Create sending wallet
  let sendingWallet = await user.createWallet();
  console.log(`sendingWallet successfully created: `, sendingWallet.toString());

  // Get sending wallet address
  let sendingAddress = sendingWallet.getDefaultAddress();
  console.log(`Default address for sendingWallet: `, sendingAddress.toString());

  // Fund sending wallet
  const faucetTransaction = await sendingWallet.faucet();
  console.log(`Faucet transaction successfully completed: `, faucetTransaction.toString());

  return sendingWallet;
}

// READ FROM CSV FILE AND SEND MASS PAYOUT
async function sendMassPayout(sendingWallet) {
  // Define amount to send
  const transferAmount = 0.000002;
  const assetId = Coinbase.assets.Eth;

  try {
    const parser = fs
      .createReadStream("./wallet-array.csv")
      .pipe(parse({ delimiter: ",", from_line: 1 }));

    for await (const row of parser) {
      const address = row[0];
      if (address) {
        try {
          await sendingWallet.createTransfer({
            // Send payment to each address in CSV
            amount: transferAmount,
            assetId: assetId,
            destination: address,
          });
          console.log(`Transfer to ${address} successful`);
        } catch (error) {
          console.error(`Error transferring to ${address}: `, error);
        }
      }
    }
  } catch (error) {
    console.error(`Error processing CSV file: `, error);
  }

  console.log("Finished processing CSV file");
}

(async () => {
  try {
    // MANAGE CDP API KEY FOR COINBASE SDK
    // Configure location to CDP API Key
    let coinbase = Coinbase.configureFromJson({
      filePath: `${os.homedir()}/Downloads/cdp_api_key.json`,
    });

    const user = await coinbase.getDefaultUser();
    const addresses = await createReceivingWallets(user);
    await writeReceivingAddressesToCsv(addresses);
    const sendingWallet = await createAndFundSendingWallet(user);
    await sendMassPayout(sendingWallet);
  } catch (error) {
    console.error(`Error in sending mass payout: `, error);
  }
})();
