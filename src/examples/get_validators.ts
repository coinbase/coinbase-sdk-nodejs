import { Coinbase, Validator } from "../../src";

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
  const validators = await Validator.list(Coinbase.networks.EthereumHolesky, "eth");

  // Loop through the validators and print each validator
  validators.forEach(validator => {
    console.log(JSON.stringify(validator, null, 2));
  });
}

(async () => {
  await listValidators();
})();
