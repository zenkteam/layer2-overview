import { BrowserNode } from "@connext/vector-browser-node";
import { ConditionalTransferCreatedPayload, ERC20Abi, FullChannelState, TransferNames, EngineEvent, EngineEvents, ConditionalTransferResolvedPayload, DepositReconciledPayload, WithdrawalReconciledPayload, WithdrawalResolvedPayload } from "@connext/vector-types";
import { Contract, utils, constants, ethers, providers } from "ethers";
import UniswapWithdrawHelper from "@connext/vector-withdraw-helpers/artifacts/contracts/UniswapWithdrawHelper/UniswapWithdrawHelper.sol/UniswapWithdrawHelper.json";
import { JsonRpcProvider } from "@ethersproject/providers";
import { getBalanceForAssetId, getRandomBytes32 } from "@connext/vector-utils";
import { BigNumber } from "@ethersproject/bignumber";
import { Evt } from "evt";

// From: https://docs.connext.network/connext-mainnet
const routerPublicIdentifier = "vector892GMZ3CuUkpyW8eeXfW2bt5W73TWEXtgV71nphXUXAmpncnj8";

// Custom Contracts containing ??? ownend by ???
// https://github.com/connext/vector-withdraw-helpers/blob/main/contracts/UniswapWithdrawHelper/UniswapWithdrawHelper.sol
const withdrawHelpers: { [chainId: number]: string } = {
  137: "0xD1CC3E4b9c6d0cb0B9B97AEde44d4908FF0be507",
  56: "0xad654314d3F6590243602D14b4089332EBb5227D",
  100: "0xe12639c8C458f719146286f8B8b7050176577a62",
};

const chainProviders: { [chainId: number]: string } = {
  56: "https://bsc-dataseed.binance.org/",
  100: "https://rpc.xdaichain.com/",
  137: 'https://rpc-mainnet.maticvigil.com/',
};

const chainJsonProviders: { [chainId: number]: providers.JsonRpcProvider } = {
  1: new JsonRpcProvider("https://mainnet.infura.io/v3/b080ce70cc7e44fdbfcc6874149f5a63"),
  56: new JsonRpcProvider("https://bsc-dataseed.binance.org/"),
  100: new JsonRpcProvider("https://rpc.xdaichain.com/"),
  137: new JsonRpcProvider("https://rpc-mainnet.maticvigil.com/"),
};

// Official routers
const uniswapRouters: { [chainId: number]: string } = {
  // Polygon QuickSwap https://github.com/QuickSwap/QuickSwap-subgraph/blob/master/subgraph.yaml => Factory 0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32
  137: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff", // router v2 https://explorer-mainnet.maticvigil.com/address/0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff/contracts
  
  // BSC PancakeSwap https://docs.pancakeswap.finance/
  56: "0x05ff2b0db69458a0750badebc4f9e13add608c7f", // router v1 https://bscscan.com/address/0x05ff2b0db69458a0750badebc4f9e13add608c7f#contracts
  // 56: "0x10ED43C718714eb63d5aA57B78B54704E256024E", // router v2 https://bscscan.com/address/0x10ED43C718714eb63d5aA57B78B54704E256024E#code
  
  // xDAI Honeyswap https://wiki.1hive.org/projects/honeyswap/honeyswap-on-xdai-1
  100: "0x1C232F01118CB8B424793ae03F870aa7D0ac7f77", // router v2 https://blockscout.com/poa/xdai/address/0x1C232F01118CB8B424793ae03F870aa7D0ac7f77/contracts
};

export const initNode = async () => {
  const node = new BrowserNode({
    routerPublicIdentifier,
    chainProviders,
  });
  await node.init();

  return node;
};

export const getOnchainBalance = async (
  ethProvider: any,
  assetId: string,
  address: any
) => {
  (window as any).constants = constants;
  (window as any).Contract = Contract;
  const balance =
    assetId === constants.AddressZero
      ? await ethProvider.getBalance(address)
      : await new Contract(assetId, ERC20Abi, ethProvider).balanceOf(address);
  return balance;
};

export const getRouterCapacity = async (
  ethProvider: JsonRpcProvider,
  token: {
    id: any;
    decimals: string | number | ethers.BigNumber | utils.Bytes;
  },
  withdrawChannel: FullChannelState,
) => {

  const routerOnchain = await getOnchainBalance(
    ethProvider,
    token.id,
    withdrawChannel.alice
  );
  
  const routerOffchain = BigNumber.from(
    getBalanceForAssetId(withdrawChannel, token.id, "bob")
  );
  return {
    routerOnchainBalance: ethers.utils.formatUnits(routerOnchain, token.decimals),
    routerOffchainBalacne: ethers.utils.formatUnits(routerOffchain, token.decimals),
  };
}

export const verifyRouterCapacityForTransfer = async (
  ethProvider: JsonRpcProvider,
  toToken: {
    id: any;
    decimals: string | number | ethers.BigNumber | utils.Bytes;
  },
  withdrawChannel: FullChannelState,
  transferAmount: any,
  swap: { hardcodedRate: number }
) => {
  return getRouterCapacity(ethProvider, toToken, withdrawChannel);
};

export const getChannelForChain = async (
  chainId: any,
  node: {
    getStateChannelByParticipants: (arg0: {
      chainId: any;
      counterparty: string;
    }) => any;
  }
) => {
  return await node.getStateChannelByParticipants({
    chainId: chainId,
    counterparty: routerPublicIdentifier,
  });
};

export const withdraw = async (
  node: {
    withdraw: (arg0: {
      assetId: any;
      amount: any;
      channelAddress: any;
      recipient: any;
    }) => any;
  },
  assetId: any,
  amount: any,
  channelAddress: any,
  recipient: boolean
) => {
  console.log("**** withdraw", {
    assetId,
    amount,
    channelAddress,
    recipient,
  });
  return await node.withdraw({
    assetId,
    amount,
    channelAddress,
    recipient,
  });
};

export const getChannelsForChains = async (
  fromChainId: any,
  toChainId: any,
  node: {
    getStateChannelByParticipants: (arg0: {
      chainId: any;
      counterparty: string;
    }) => any;
    setup: (arg0: {
      chainId: any;
      counterpartyIdentifier: string;
      timeout: string;
    }) => any;
    getStateChannel: (arg0: { channelAddress: any }) => any;
  }
) => {

  // get FromChannel
  let fromChannelRes = await node.getStateChannelByParticipants({
    chainId: fromChainId,
    counterparty: routerPublicIdentifier,
  });
  if (fromChannelRes.isError) {
    throw fromChannelRes.getError();
  }
  let fromChannel = fromChannelRes.getValue();
  console.debug("fromChannel: ", fromChannel);

  // Fallback???
  // if (!fromChannel) {
  //   const res = await node.setup({
  //     chainId: fromChainId,
  //     counterpartyIdentifier: routerPublicIdentifier,
  //     timeout: "100000",
  //   });
  //   if (res.isError) {
  //     throw res.getError();
  //   }
  //   console.log("res.getValue(): ", res.getValue());
  //   const channelStateRes = await node.getStateChannel({
  //     channelAddress: res.getValue(),
  //   });
  //   if (channelStateRes.isError) {
  //     throw res.getError();
  //   }
  //   fromChannel = channelStateRes.getValue();
  // }

  // get ToChannel
  const toChannelRes = await node.getStateChannelByParticipants({
    chainId: toChainId,
    counterparty: routerPublicIdentifier,
  });
  if (toChannelRes.isError) {
    throw toChannelRes.getError();
  }
  let toChannel = toChannelRes.getValue();
  console.debug("toChannel: ", toChannel);

  // Fallback??
  // if (!toChannel) {
  //   const res = await node.setup({
  //     chainId: toChainId,
  //     counterpartyIdentifier: routerPublicIdentifier,
  //     timeout: "100000",
  //   });
  //   if (res.isError) {
  //     throw res.getError();
  //   }
  //   console.log("res.getValue(): ", res.getValue());
  //   const channelStateRes = await node.getStateChannel({
  //     channelAddress: res.getValue(),
  //   });
  //   if (channelStateRes.isError) {
  //     throw res.getError();
  //   }
  //   toChannel = channelStateRes.getValue();
  // }
  return { fromChannel, toChannel };
};

export const getRouterBalances = async ({
  fromChain,
  toChain,
  fromToken,
  toToken,
  node,
}: any) => {
  let { fromChannel, toChannel } = await getChannelsForChains(
    fromChain,
    toChain,
    node
  );
  const preTransferBalance = getBalanceForAssetId(
    fromChannel,
    fromToken,
    "bob"
  );
  const postTransferBalance = getBalanceForAssetId(toChannel, toToken, "bob");
  return {
    preTransferBalance,
    postTransferBalance,
  };
};

export type EvtContainer = {
  [EngineEvents.CONDITIONAL_TRANSFER_CREATED]: Evt<ConditionalTransferCreatedPayload>;
  [EngineEvents.CONDITIONAL_TRANSFER_RESOLVED]: Evt<ConditionalTransferResolvedPayload>;
  [EngineEvents.DEPOSIT_RECONCILED]: Evt<DepositReconciledPayload>;
  [EngineEvents.WITHDRAWAL_RECONCILED]: Evt<WithdrawalReconciledPayload>;
  [EngineEvents.WITHDRAWAL_RESOLVED]: Evt<WithdrawalResolvedPayload>;
};

export const createEvtContainer = (node: BrowserNode): EvtContainer => {
  const createdTransfer = Evt.create<ConditionalTransferCreatedPayload>();
  const resolvedTransfer = Evt.create<ConditionalTransferResolvedPayload>();
  const deposit = Evt.create<DepositReconciledPayload>();
  const withdrawReconciled = Evt.create<WithdrawalReconciledPayload>();
  const withdrawResolved = Evt.create<WithdrawalResolvedPayload>();

  node.on(EngineEvents.CONDITIONAL_TRANSFER_CREATED, data => {
    console.log("EngineEvents.CONDITIONAL_TRANSFER_CREATED: ", data);
    createdTransfer.post(data);
  });
  node.on(EngineEvents.CONDITIONAL_TRANSFER_RESOLVED, data => {
    console.log("EngineEvents.CONDITIONAL_TRANSFER_RESOLVED: ", data);
    resolvedTransfer.post(data);
  });
  node.on(EngineEvents.DEPOSIT_RECONCILED, data => {
    console.log("EngineEvents.DEPOSIT_RECONCILED: ", data);
    deposit.post(data);
  });
  node.on(EngineEvents.WITHDRAWAL_RECONCILED, data => {
    console.log("EngineEvents.WITHDRAWAL_RECONCILED: ", data);
    withdrawReconciled.post(data);
  });
  node.on(EngineEvents.WITHDRAWAL_RESOLVED, data => {
    console.log("EngineEvents.WITHDRAWAL_RESOLVED: ", data);
    withdrawResolved.post(data);
  });
  return {
    [EngineEvents.CONDITIONAL_TRANSFER_CREATED]: createdTransfer,
    [EngineEvents.CONDITIONAL_TRANSFER_RESOLVED]: resolvedTransfer,
    [EngineEvents.DEPOSIT_RECONCILED]: deposit,
    [EngineEvents.WITHDRAWAL_RECONCILED]: withdrawReconciled,
    [EngineEvents.WITHDRAWAL_RESOLVED]: withdrawResolved,
  };
};



async function refreshChannel(node: BrowserNode, oldChannel: any) : Promise<FullChannelState> {
  const channelStateRes = await node.getStateChannel({
    channelAddress: oldChannel.channelAddress,
  });
  if (channelStateRes.isError) {
    throw channelStateRes.getError();
  }
  return channelStateRes.getValue() as FullChannelState;
}

async function refreshBalance(
  node: BrowserNode, 
  oldChannel: FullChannelState,
  assetId: string,
  participant: "alice" | "bob",
) {
  const channel = await refreshChannel(node, oldChannel);
  return getBalanceForAssetId(channel, assetId, participant);
}

async function deposit(node: BrowserNode, channel: any, signer: any, token: string, amount: string) {
  // Ask user to transfer to channel
  const fromTokenContract = new Contract(
    token,
    ERC20Abi,
    signer
  );
  const tx = await fromTokenContract.transfer(
    channel.channelAddress,
    amount
  );
  // setLog(`(1/7) Starting swap`, { tx: tx.hash, chainId: fromChainId });
  
  // Confirmed
  const receipt = await tx.wait();
  // reconcile deposit on from chain
  // const e = {} as EngineEvent;
  // node.waitFor<EngineEvent>(e, 300_000, payload => {
  //   console.log(payload);
  // })
  const depositRes = await node.reconcileDeposit({
    channelAddress: channel.channelAddress,
    assetId: token,
  });
  if (depositRes.isError) {
    throw depositRes.getError();
  }
  console.log(`INFO: Deposit complete`);
}

async function handleNodeResponse(channel: FullChannelState, nodeResponsePromise: Promise<any>) {
  // try normal handling instead
  const resolved = await nodeResponsePromise;
  if (resolved.isError) {
    throw resolved.getError();
  }
  console.log(`nodeResponse: `, resolved.getValue());

  // make sure tx is sent
  const resolvedHash = resolved.getValue().transactionHash;
  if (resolvedHash) {
    const receipt = await chainJsonProviders[channel.networkContext.chainId].waitForTransaction(
      resolvedHash!
    );
    console.log("nodeResponse tx receipt: ", receipt);
  }
}

async function swapInChannel(evt: EvtContainer, node: BrowserNode, channel: FullChannelState, amount: string, tokenA: string, tokenB: string) {
  // define swap
  const helperContract = new Contract(
    withdrawHelpers[channel.networkContext.chainId],
    UniswapWithdrawHelper.abi,
    chainJsonProviders[channel.networkContext.chainId]
  );
  const swapDataOption = {
    amountIn: amount,
    amountOutMin: 1, // TODO: maybe change this, but this will make the swap always succeed
    router: uniswapRouters[channel.networkContext.chainId],
    to: channel.channelAddress,
    tokenA,
    tokenB,
    path: [tokenA, tokenB],
  };
  const swapData = await helperContract.getCallData(swapDataOption);

  // trigger swap by withdrawing coins to contract
  const toSwapWithdrawPromise = node.withdraw({
    assetId: tokenA,
    amount: amount,
    channelAddress: channel.channelAddress,
    callData: swapData,
    callTo: withdrawHelpers[channel.networkContext.chainId],
    recipient: withdrawHelpers[channel.networkContext.chainId],
  });
  
  try {
    await evt.WITHDRAWAL_RESOLVED.waitFor(30_000)
  } catch {
    await handleNodeResponse(channel, toSwapWithdrawPromise)
  }

  // reconcile deposit on toChain
  const depositRes = await node.reconcileDeposit({
    channelAddress: channel.channelAddress,
    assetId: tokenB,
  });
  if (depositRes.isError) {
    throw depositRes.getError();
  }
}

async function transferBetweenChains(node: BrowserNode, fromChannel: any, fromToken: string, toChannel: any, toToken: string, amount: string) {
  // generate Secrets
  const preImage = getRandomBytes32();
  const lockHash = utils.soliditySha256(["bytes32"], [preImage]);
  const routingId = getRandomBytes32();

  await node.conditionalTransfer({
    publicIdentifier: node.publicIdentifier,
    amount: amount,
    assetId: fromToken,
    channelAddress: fromChannel.channelAddress,
    type: TransferNames.HashlockTransfer,
    details: {
      lockHash,
      expiry: "0",
    },
    meta: {
      routingId,
    },
    recipient: node.publicIdentifier,
    recipientChainId: toChannel.networkContext.chainId,
    recipientAssetId: toToken,
  });

  // await transfer event
  console.log(
    `Waiting for transfer creation on channel ${toChannel.channelAddress}`
  );
  const toTransferData = await new Promise<ConditionalTransferCreatedPayload>(
    (res) => {
      node.on(
        "CONDITIONAL_TRANSFER_CREATED",
        (data: ConditionalTransferCreatedPayload) => {
          console.log("CONDITIONAL_TRANSFER_CREATED data: ", {
            data,
            toChannel,
          });
          if (data.channelAddress === toChannel.channelAddress) {
            res(data);
          } else {
            console.log(
              `Got transfer for ${data.channelAddress}, waiting for ${toChannel.channelAddress}`
            );
          }
        }
      );
    }
  );

  // resolve transfer
  const resolveRes = await node.resolveTransfer({
    channelAddress: toChannel.channelAddress,
    transferResolver: {
      preImage,
    },
    transferId: toTransferData.transfer.transferId,
  });
  if (resolveRes.isError) {
    throw resolveRes.getError();
  }
  const resolve = resolveRes.getValue();
  console.log("resolve: ", resolve);
}

async function withdrawFromChannel(evt: EvtContainer, node: BrowserNode, channel: FullChannelState, recipient: any, token: string, amount: string) {
  const withdrawPromise = node.withdraw({
    assetId: token,
    amount: amount,
    channelAddress: channel.channelAddress,
    publicIdentifier: channel.bobIdentifier,
    recipient,
  });

  try {
    await evt.WITHDRAWAL_RESOLVED.waitFor(30_000)
  } catch {
    await handleNodeResponse(channel, withdrawPromise)
  }
}


export const swap = async (
  swapAmount: ethers.BigNumberish,
  fromToken: string,
  fromTokenPair: string,
  toToken: string,
  toTokenPair: string,
  fromChainId: number,
  toChainId: number,
  node: BrowserNode,
  provider: providers.JsonRpcProvider,
  setLog: any
) => {

  const signer = await provider.getSigner();
  const signerAddress = await signer.getAddress();
  const network = await provider.getNetwork();
  let { fromChannel, toChannel } = await getChannelsForChains(
    fromChainId,
    toChainId,
    node
  );
  
  // user (provider) has to be on chain where transfers start
  if (network.chainId !== fromChainId) {
    throw new Error(
      `Wrong network, expected chainId ${fromChainId}, got ${network.chainId}`
    );
  }

  const evts = createEvtContainer(node);
  
  const balance = getBalanceForAssetId(fromChannel, fromToken, "bob");
  console.log('INFO: current fromToken Balance on fromChannel:', balance)
  console.log('INFO: current fromTokenPair Balance on fromChannel:', getBalanceForAssetId(fromChannel, fromTokenPair, "bob"))
  console.log('INFO: current toToken Balance on toChannel:', getBalanceForAssetId(toChannel, toToken, "bob"))
  console.log('INFO: current toTokenPair Balance on toChannel:', getBalanceForAssetId(toChannel, toTokenPair, "bob"))

  // ## Deposit fromToken in the channel
  if (BigNumber.from(balance).lt(swapAmount)) {
    console.log("INFO: >> need to load more on channel");

    await deposit(node, fromChannel, provider.getSigner(), fromToken, swapAmount.toString());

    // fromChannel = await refreshChannel(node, fromChannel);
    const balance = await refreshBalance(node, fromChannel, fromToken, "bob");
    console.log('INFO: fromToken Balance on fromChannel:', balance)
  } else {
    // setLog("(2/7) Balance in channel, sending now.");
    console.log("INFO: >> that's enough");
  }

  // // ## Swap on fromChain
  console.log('INFO: swap start');
  await swapInChannel(evts, node, fromChannel, swapAmount.toString(), fromToken, fromTokenPair)
  console.log('INFO: swap done');

  // refresh channel to get new balance
  // fromChannel = await refreshChannel(node, fromChannel);
  const postFromSwapBalance = await refreshBalance(node, fromChannel, fromTokenPair, "bob");
  console.log("postFromSwapBalance: ", postFromSwapBalance);


  // ## Transfer cross chain
  console.log('INFO: transfer start');
  await transferBetweenChains(node, fromChannel, fromTokenPair, toChannel, toToken, postFromSwapBalance);
  console.log('INFO: transfer done');

  // refresh channel to get new balance
  // toChannel = await refreshChannel(node, toChannel)
  const postCrossChainTransferBalance = await refreshBalance(node, toChannel, toToken, "bob");
  console.log("postCrossChainTransferBalance: ", postCrossChainTransferBalance);


  // withdraw with swap data
  console.log('INFO: swap start');
  await swapInChannel(evts, node, toChannel, postCrossChainTransferBalance, toToken, toTokenPair)
  console.log('INFO: swap done');

  // refresh channel to get new balance
  // toChannel = await refreshChannel(node, toChannel)
  const posttoSwapBalance = await refreshBalance(node, toChannel, toTokenPair, "bob");
  console.log("posttoSwapBalance: ", posttoSwapBalance);


  // withdraw to address
  console.log('INFO: withdraw start');
  await withdrawFromChannel(evts, node, toChannel, signerAddress, toTokenPair, posttoSwapBalance);
  console.log('INFO: withdraw done');

  console.log(`To withdraw complete`);

  console.log('INFO: current fromToken Balance on fromChannel:', await refreshBalance(node, fromChannel, fromToken, "bob"))
  console.log('INFO: current fromTokenPair Balance on fromChannel:', await refreshBalance(node, fromChannel, fromTokenPair, "bob"))
  console.log('INFO: current toToken Balance on toChannel:', await refreshBalance(node, toChannel, toToken, "bob"))
  console.log('INFO: current toTokenPair Balance on toChannel:', await refreshBalance(node, toChannel, toTokenPair, "bob"))
};
