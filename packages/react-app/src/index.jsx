import React from "react";
import ReactDOM from "react-dom";
import ApolloClient from "apollo-boost";
import { ApolloProvider } from "@apollo/react-hooks";
import "./index.css";
import App from "./App";
import bsc from "./assets/bsc.png";
import eth from "./assets/ethereum.png";
import pancake from "./assets/pancake.png";
import matic from "./assets/matic.png";
import quick from "./assets/quick.png";
import honey from "./assets/honey.png";
import xdai from "./assets/xdai.png";
import uniswap from "./assets/uniswap.png";
import uniswapData from './data/uniswapv2.json'
import pancakeData from './data/pancake.json'
import honeyData from './data/honey.json'
import quickData from './data/quick.json'

// See all subgraphs: https://thegraph.com/explorer/

// Mainnet:
const chainInfos = [
  {
  chainId: 1,
  chainIcon: eth,
  name: 'ETH',
  client: new ApolloClient({ uri: "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2"}),
  bitQueryClient: new ApolloClient({ uri: "https://graphql.bitquery.io" }),
  tokenSymbol: 'ETH',
  tokenAddress: '0x0000000000000000000000000000000000000000',
  exchangeName: 'UniswapV2',
  exchangeIcon: uniswap,
  exchangeUrl: 'https://app.uniswap.org/#/swap',
  instructionGuide: '',
  explorerUrl: 'https://etherscan.io/',
  exchangeRouterAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  rpcUrl: 'https://mainnet.infura.io/v3/32d5cc1a92d84314919fa8b495765071',
  tokenData: uniswapData.data.tokens,
  derivedPriceCoin: 'ethereum',
  color: 'rgb(125, 2, 94)',
}, {
  chainId: 56,
  chainIcon: bsc,
  name: 'BSC',
  client: new ApolloClient({ uri: "https://api.thegraph.com/subgraphs/name/bscnodes/pancakeswap"}), // alt: https://api.bscgraph.org/subgraphs/name/cakeswap out of sync: "https://api.thegraph.com/subgraphs/name/pancakeswap/exchange"
  bitQueryClient: new ApolloClient({ uri: "https://graphql.bitquery.io" }),
  tokenSymbol: 'BNB',
  tokenAddress: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
  exchangeName: 'Pancake',
  exchangeIcon: pancake,
  exchangeUrl: 'https://exchange.pancakeswap.finance/',
  instructionGuide: 'https://academy.binance.com/en/articles/connecting-metamask-to-binance-smart-chain',
  explorerUrl: 'https://bscscan.com',
  exchangeRouterAddress: '0x05ff2b0db69458a0750badebc4f9e13add608c7f',
  rpcUrl: 'https://bsc-dataseed1.defibit.io',
  tokenData: pancakeData.data.tokens,
  derivedPriceCoin: 'binancecoin',
  color: 'rgb(125, 253, 94)',
}, {
  chainId: 137,
  chainIcon: matic,
  name: 'Matic',
  client: new ApolloClient({ uri: "https://api.thegraph.com/subgraphs/name/sameepsi/quickswap" }), // alternative?: "https://graph01.ginete.in/subgraphs/name/matic/quickswap"
  tokenSymbol: 'MATIC',
  tokenAddress: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0',
  exchangeName: 'Quick',
  exchangeIcon: quick,
  exchangeUrl: 'https://quickswap.exchange/',
  instructionGuide: 'https://docs.matic.network/docs/develop/metamask/config-matic',
  exchangeRouterAddress: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
  explorerUrl: 'https://explorer-mainnet.maticvigil.com',
  rpcUrl: 'https://rpc-mainnet.matic.network',
  tokenData: quickData.data.tokens,
  derivedPriceCoin: 'ethereum', // Matic derived price is actually ETH
  color: 'rgb(40, 179, 232)',
}, {
  chainId: 100,
  chainIcon: xdai,
  name: 'xDai',
  client: new ApolloClient({ uri: "https://api.thegraph.com/subgraphs/name/1hive/uniswap-v2" }),
  tokenSymbol: 'xDAI',
  tokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
  exchangeName: 'Honey',
  exchangeIcon: honey,
  exchangeUrl: 'https://honeyswap.org/',
  instructionGuide: 'https://www.xdaichain.com/for-users/wallets/metamask/metamask-setup',
  exchangeRouterAddress: '0x1C232F01118CB8B424793ae03F870aa7D0ac7f77',
  explorerUrl: 'https://blockscout.com/poa/xdai', // https://blockscout.com/xdai/mainnet
  rpcUrl: 'https://rpc.xdaichain.com',
  tokenData: honeyData.data.tokens,
  derivedPriceCoin: 'dai',
  color: 'rgb(255, 177, 37)',
}]

// more swaps:
// BurgerSwap: https://burgerswap.org/trade/swap "https://info.burgerswap.org/subgraphs/name/burgerswap/platform"

ReactDOM.render(
  <ApolloProvider client={chainInfos[0].client}>
    <App
      chainInfos={chainInfos}
    />
  </ApolloProvider>,
  document.getElementById("root"),
);
