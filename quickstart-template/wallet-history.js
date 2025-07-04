import { Coinbase, Wallet } from "@coinbase/coinbase-sdk";

// Change this to the path of your API key file downloaded from CDP portal.
Coinbase.configureFromJson({ filePath: "~/Downloads/cdp_api_key.json" });

(async function () {
  // Create wallets for transferring funds between each other
  let myWallet = await Wallet.create();
  let anotherWallet = await Wallet.create();

  console.log("Wallets created! ...");

  let myWalletDefaultAddress = await myWallet.getDefaultAddress();
  let anotherWalletDefaultAddress = await anotherWallet.getDefaultAddress();
  const myWalletAddressId = myWalletDefaultAddress.getId();
  const anotherWalletAddressId = anotherWalletDefaultAddress.getId();
  console.log("myWallet address: ", myWalletAddressId);
  console.log("anotherWallet address: ", anotherWalletAddressId);

  // Faucet wallet to add some funds
  const usdcFaucetTx = await myWallet.faucet(Coinbase.assets.Usdc); // USDC funds to actual transaction
  await sleep(2000);
  const ethFaucetTx = await myWallet.faucet(Coinbase.assets.Eth); // ETH funds for transfer gas fee (USDC gas fee is charged in ETH)

  // Wait for the faucet transactions to complete or fail on-chain.
  await usdcFaucetTx.wait();
  await ethFaucetTx.wait();

  console.log("\nFunds added to myWallet! ...");
  console.log("Funds available on myWallet:", (await myWallet.listBalances()).toString());
  console.log("Funds available on anotherWallet:", (await anotherWallet.listBalances()).toString());

  const TRANSFER_AMOUNT = 0.0001;
  const TRANSFER_NUMBER = 3;
  let ASSET = Coinbase.assets.Usdc;
  // ASSET = Coinbase.assets.Eth; // Uncomment for changing the asset to ETH

  console.log(
    "\n\n------------------------------------------------------------------------------------------------------------------",
  );
  console.log(
    `We're going to transfer ${TRANSFER_AMOUNT} ${ASSET} ${TRANSFER_NUMBER} times from myWallet to anotherWallet...`,
  );
  console.log(
    "------------------------------------------------------------------------------------------------------------------",
  );
  console.log("Please press Enter to continue...");
  await waitForEnter();

  for (let i = 1; i <= TRANSFER_NUMBER; i++) {
    console.log(`Creating transfer ${i} of ${TRANSFER_NUMBER}...`);

    // Create transfer from myWallet to anotherWallet
    const transfer = await myWallet.createTransfer({
      amount: TRANSFER_AMOUNT,
      assetId: ASSET,
      destination: anotherWallet,
      gasless: true, // for USDC, you can also add gasless flag, so you don't need to add ETH funds for paying for gas fees
    });

    try {
      // Wait for the transfer to complete or fail on-chain
      await transfer.wait({
        intervalSeconds: 1, // check for transfer completion each 1 second
        timeoutSeconds: 30, // keep checking for 30 seconds
      });
      console.log(`Transfer ${i} successfully completed: `, transfer.toString());
    } catch (e) {
      console.log(
        `Some error happened (this doesn't necessarily mean transfer failed) :`,
        e.toString(),
      );
    }
    console.log(
      "------------------------------------------------------------------------------------------------------------------",
    );
  }

  console.log(
    "Funds available on myWallet after transfers:",
    (await myWallet.listBalances()).toString(),
  );
  console.log(
    "Funds available on anotherWallet after transfer (previously no balance):",
    (await anotherWallet.listBalances()).toString(),
  );

  console.log(
    "\n\n------------------------------------------------------------------------------------------------------------------",
  );
  console.log(
    `We're going to transfer ${TRANSFER_AMOUNT} ${ASSET} back from anotherWallet to myWallet...`,
  );
  console.log(
    "------------------------------------------------------------------------------------------------------------------",
  );
  console.log("Please press Enter to continue...");
  await waitForEnter();

  console.log(
    `\nTransferring ${TRANSFER_AMOUNT} ${ASSET} back from anotherWallet to myWallet...\n`,
  );
  // Transfer back to myWallet a small amount
  const transfer = await anotherWallet.createTransfer({
    amount: TRANSFER_AMOUNT,
    assetId: ASSET,
    destination: myWallet,
    gasless: true, // for USDC, you can also add gasless flag, so you don't need to add ETH funds for paying for gas fees
  });

  try {
    // Wait for the transfer to complete or fail on-chain
    await transfer.wait({
      intervalSeconds: 1, // check for transfer completion each 1 second
      timeoutSeconds: 30, // keep checking for 30 seconds
    });
    console.log(`Transfer successfully completed: `, transfer.toString());
  } catch (e) {
    console.log(
      `Some error happened (this doesn't necessarily mean transfer failed) :`,
      e.toString(),
    );
  }

  console.log(
    "------------------------------------------------------------------------------------------------------------------",
  );
  console.log(
    "\nFunds available on myWallet after transfers:",
    (await myWallet.listBalances()).toString(),
  );
  console.log(
    `Funds available on anotherWallet after transfer (previously ${(TRANSFER_AMOUNT * TRANSFER_NUMBER).toFixed(4)}):`,
    (await anotherWallet.listBalances()).toString(),
  );
  console.log(
    "\n------------------------------------------------------------------------------------------------------------------",
  );

  console.log("Note: transactions can take a few seconds to appear on the listTransactions.");
  console.log("Waiting a few secs for transactions to be processed...");
  await sleep(6000);

  console.log("\nPlease press Enter to list the anotherWallet history...");
  await waitForEnter();

  /*
   * Wallets come with a single default Address, accessible via getDefaultAddress()
   * From the wallet default address object, you can list the transactions that were just made:
   */
  let anotherWalletAddress = await anotherWallet.getDefaultAddress();

  // Use for listing all received transfers
  let transactions = (await anotherWalletAddress.listTransactions()).data;

  console.log(
    "\n------------------------------------------------------------------------------------------------------------------",
  );
  console.log("Please note: Transactions can take some time to appear in .listTransactions()");
  console.log(`Transaction list (${transactions.length}):\n`);
  for (const transaction of transactions) {
    console.log(transaction.toString());
    console.log("\n");
  }
  console.log(
    "------------------------------------------------------------------------------------------------------------------",
  );

  while (transactions.length === 0) {
    console.log("No transactions found. Press enter to continue waiting...");
    await waitForEnter();
    transactions = (await anotherWalletAddress.listTransactions()).data;
  }

  // You can also get a specific transaction link to see transaction details on basescan.
  console.log("transactions[0] transaction_link:", transactions[0].getTransactionLink());
  console.log(
    "More details on what is available on transaction object here: https://coinbase.github.io/coinbase-sdk-nodejs/classes/coinbase_transaction.Transaction.html",
  );

  const firstTransactionContent = transactions[0].content();
  console.log(
    "\ntransactions[0].content() block_timestamp:",
    firstTransactionContent.block_timestamp,
  );
  console.log(
    "More details on what is available on transaction.content() here: https://coinbase.github.io/coinbase-sdk-nodejs/interfaces/client_api.EthereumTransaction.html",
  );

  console.log("\nCompleted!");
})().then(process.exit);

// --------------------------------------------------------------------------------------------------------------------------------
function waitForEnter() {
  return new Promise(resolve => {
    process.stdin.on("data", function (chunk) {
      if (chunk[0] === 10) {
        resolve();
      }
    });
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
