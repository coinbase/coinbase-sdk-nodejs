import { Coinbase, Validator } from "..";

const apiKeyFilePath = "/Users/drmoo/.apikeys/prod.json";

/**
 * List the validators you've provisioned on the `ethereum-holesky` testnet network.
 */
/**
 * List the validators you've provisioned on the `ethereum-holesky` testnet network.
 */
async function listValidators() {
  await Coinbase.configureFromJson({ filePath: apiKeyFilePath });

  // Get the validators that you've provisioned for staking.
  const validator = await Validator.fetch(
    Coinbase.networks.EthereumHolesky,
    "eth",
    "0xa1d1ad0714035353258038e964ae9675dc0252ee22cea896825c01458e1807bfad2f9969338798548d9858a571f7425c",
  );

  console.log(JSON.stringify(validator, null, 2));
}

(async () => {
  await listValidators();
})();
