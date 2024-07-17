const pedersen = window.starknet.pedersen;
const poseidonHashMany = window.starknet.poseidonHashMany;

const AToBI = array => array.map(it => BigInt(it));

/* eslint-disable no-bitwise */
const DATA_AVAILABILITY_MODE_BITS = 32n;
const MAX_AMOUNT_BITS = 64n;
const MAX_PRICE_PER_UNIT_BITS = 128n;
const RESOURCE_VALUE_OFFSET = MAX_AMOUNT_BITS + MAX_PRICE_PER_UNIT_BITS;
const L1_GAS_NAME = BigInt(encodeShortString("L1_GAS"));
const L2_GAS_NAME = BigInt(encodeShortString("L2_GAS"));

const TransactionHashPrefix = Object.freeze({
  DECLARE: "0x6465636c617265", // encodeShortString('declare'),
  DEPLOY: "0x6465706c6f79", // encodeShortString('deploy'),
  DEPLOY_ACCOUNT: "0x6465706c6f795f6163636f756e74", // encodeShortString('deploy_account'),
  INVOKE: "0x696e766f6b65", // encodeShortString('invoke'),
  L1_HANDLER: "0x6c315f68616e646c6572" // encodeShortString('l1_handler'),
});

/**
 * Compute pedersen hash from data
 * @returns format: hex-string - pedersen hash
 */
function computeHashOnElements(data) {
  return [...data, data.length]
    .reduce((x, y) => pedersen(BigInt(x), BigInt(y)), 0)
    .toString();
}

/**
 * Calculate transaction pedersen hash for common properties
 *
 * Following implementation is based on this python [implementation #](https://github.com/starkware-libs/cairo-lang/blob/b614d1867c64f3fb2cf4a4879348cfcf87c3a5a7/src/starkware/starknet/core/os/transaction_hash/transaction_hash.py)
 * @returns format: hex-string
 */
function calculateTransactionHashCommonV2(
  txHashPrefix,
  version,
  contractAddress,
  entryPointSelector,
  calldata,
  maxFee,
  chainId,
  additionalData = []
) {
  const calldataHash = computeHashOnElements(calldata);
  const dataToHash = [
    txHashPrefix,
    version,
    contractAddress,
    entryPointSelector,
    calldataHash,
    maxFee,
    chainId,
    ...additionalData
  ];
  return computeHashOnElements(dataToHash);
}

/**
 * Calculate invoke transaction hash
 * @returns format: hex-string
 */
function calculateInvokeTransactionHashV2(
  contractAddress,
  version,
  calldata,
  maxFee,
  chainId,
  nonce
) {
  return calculateTransactionHashCommonV2(
    TransactionHashPrefix.INVOKE,
    version,
    contractAddress,
    0,
    calldata,
    maxFee,
    chainId,
    [nonce]
  );
}

function hashDAMode(nonceDAMode, feeDAMode) {
  return (
    (BigInt(nonceDAMode) << DATA_AVAILABILITY_MODE_BITS) + BigInt(feeDAMode)
  );
}

function hashFeeField(tip, bounds) {
  const L1Bound =
    (L1_GAS_NAME << RESOURCE_VALUE_OFFSET) +
    (BigInt(bounds.l1_gas.max_amount) << MAX_PRICE_PER_UNIT_BITS) +
    BigInt(bounds.l1_gas.max_price_per_unit);

  const L2Bound =
    (L2_GAS_NAME << RESOURCE_VALUE_OFFSET) +
    (BigInt(bounds.l2_gas.max_amount) << MAX_PRICE_PER_UNIT_BITS) +
    BigInt(bounds.l2_gas.max_price_per_unit);

  return poseidonHashMany([BigInt(tip), L1Bound, L2Bound]);
}

function calculateTransactionHashCommonV3(
  txHashPrefix,
  version,
  senderAddress,
  chainId,
  nonce,
  tip,
  paymasterData,
  nonceDataAvailabilityMode,
  feeDataAvailabilityMode,
  resourceBounds,
  additionalData = []
) {
  const feeFieldHash = hashFeeField(tip, resourceBounds);
  const dAModeHash = hashDAMode(
    nonceDataAvailabilityMode,
    feeDataAvailabilityMode
  );
  const dataToHash = AToBI([
    txHashPrefix,
    version,
    senderAddress,
    feeFieldHash,
    poseidonHashMany(AToBI(paymasterData)),
    chainId,
    nonce,
    dAModeHash,
    ...AToBI(additionalData)
  ]);
  return toHex(poseidonHashMany(dataToHash));
}

/**
 * Calculate v3 invoke transaction hash
 * @returns format: hex-string
 */
function calculateInvokeTransactionHashV3(
  senderAddress,
  version,
  compiledCalldata,
  chainId,
  nonce,
  accountDeploymentData,
  nonceDataAvailabilityMode,
  feeDataAvailabilityMode,
  resourceBounds,
  tip,
  paymasterData
) {
  return calculateTransactionHashCommonV3(
    TransactionHashPrefix.INVOKE,
    version,
    senderAddress,
    chainId,
    nonce,
    tip,
    paymasterData,
    nonceDataAvailabilityMode,
    feeDataAvailabilityMode,
    resourceBounds,
    [
      poseidonHashMany(AToBI(accountDeploymentData)),
      poseidonHashMany(AToBI(compiledCalldata))
    ]
  );
}

function calculateInvokeTransactionHash(args) {
  if (isV3InvokeTx(args)) {
    return calculateInvokeTransactionHashV3(
      args.senderAddress,
      args.version,
      args.compiledCalldata,
      args.chainId,
      args.nonce,
      args.accountDeploymentData,
      args.nonceDataAvailabilityMode,
      args.feeDataAvailabilityMode,
      args.resourceBounds,
      args.tip,
      args.paymasterData
    );
  }
  return calculateInvokeTransactionHashV2(
    args.senderAddress,
    args.version,
    args.compiledCalldata,
    args.maxFee,
    args.chainId,
    args.nonce
  );
}

function isV3InvokeTx(args) {
  return ["0x3", "0x100000000000000000000000000000003"].includes(args.version);
}

window.calculateInvokeTransactionHash = calculateInvokeTransactionHash;
