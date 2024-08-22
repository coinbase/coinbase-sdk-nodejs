import { Coinbase, Wallet } from "@coinbase/coinbase-sdk";
import { createArrayCsvWriter } from "csv-writer";
import os from "os";
import fs from "fs";
import { parse } from "csv-parse";

// Create receiving Wallets.
async function createReceivingWallets() {
  // Create 5 receiving Wallets and only store Wallet Addresses.
  const addresses = [];

  for (let i = 1; i <= 5; i++) {
    let receivingWallet = await Wallet.create();
    console.log(`Receiving Wallet${i} successfully created: `, receivingWallet.toString());

    let receivingAddress = receivingWallet.getDefaultAddress();
    console.log(`Default address for Wallet${i}: `, receivingAddress.getId());
    addresses.push([receivingAddress.getId()]); // Storing Address as an array.
  }

  return addresses;
}

// Write to CSV file with receiving Wallet Addresses.
async function writeReceivingAddressesToCsv(addresses) {
  // Define CSV file.
  const csvWriter = createArrayCsvWriter({
    path: "wallet-array.csv",
    header: false,
  });

  // Write Wallet Addresses to CSV file.
  await csvWriter.writeRecords(addresses);
  console.log("The CSV file was written successfully without headers.");
}

// Create and fund a sending Wallet.
async function createAndFundSendingWallet() {
  // Create sending Wallet.
  let sendingWallet = await Wallet.create();
  console.log(`sendingWallet successfully created: `, sendingWallet.toString());

  // Get sending Wallet Address.
  let sendingAddress = sendingWallet.getDefaultAddress();
  console.log(`Default address for sendingWallet: `, sendingAddress.toString());

  // Fund sending Wallet.
  const faucetTransaction = await sendingWallet.faucet();
  console.log(`Faucet transaction successfully completed: `, faucetTransaction.toString());

  return sendingWallet;
}

// Read from CSV file and send mass payout.
async function sendMassPayout(sendingWallet) {
  // Define amount to send.
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
          const transfer = await sendingWallet.createTransfer({
            // Send payment to each Address in CSV.
            amount: transferAmount,
            assetId: assetId,
            destination: address,
          });

          await transfer.wait();

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
    // Manage CDP Api Key for Coinbase SDK.
    // Configure location to CDP API Key.
    let coinbase = Coinbase.configureFromJson({
      filePath: `${os.homedir()}/Downloads/cdp_api_key.json`,
    });

    const addresses = await createReceivingWallets();
    await writeReceivingAddressesToCsv(addresses);
    const sendingWallet = await createAndFundSendingWallet();
    await sendMassPayout(sendingWallet);
  } catch (error) {
    console.error(`Error in sending mass payout: `, error);
  }
})();
