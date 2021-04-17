import { Content } from '.';
import React, { useState, useEffect } from "react";

import { getTokenBalance, getProvider } from "../utils";
import { getRouterCapacity, getChannelForChain } from "../connext";

function Overview({ chainInfos, combined, account, connextNode }) {

  // Balances
  const [balances, setBalances] = useState({})
  useEffect(() => {
    if (combined && account) {
      const newBalances = {}
      const promises = []
      for (let i = 0; i < chainInfos.length; i++) {
        if (!newBalances[chainInfos[i].name]) {
          newBalances[chainInfos[i].name] = {}
        }

        // request balances
        for (let coin of combined) {
          // console.log(chainInfos[i].name, coin.data[i])
          promises.push(getTokenBalance(chainInfos[i].rpcUrl, coin.data[i], account)
            .then((balance) => {
              newBalances[chainInfos[i].name][coin.data[i].symbol] = balance
            }))
        }
      }

      // gas currency
      // > binance - BNB
      const WBNB = {
        "decimals": "18",
        "derivedETH": "1",
        "id": "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
        "symbol": "WBNB",
        "totalLiquidity": "3248617.990725643481804216",
        "tradeVolumeUSD": "13045677425.56418205932560471101256",
        "txCount": "11293302",
        "untrackedVolumeUSD": "13046268602.0219986712024568495995"
      }
      promises.push(getTokenBalance(chainInfos[0].rpcUrl, WBNB, account)
        .then((balance) => {
          newBalances[chainInfos[0].name][WBNB.symbol] = balance
        }))

      // update state once
      Promise.all(promises).then(() => {
        setBalances(newBalances)
      })
    }
  }, [chainInfos, combined, account])

  // Routers
  const [routers, setRouters] = useState({})
  useEffect(() => {
    if (connextNode) {
      const newRouters = {}
      for (const chain of chainInfos) {
        newRouters[chain.name] = {}
      }

      // channel for chain
      Promise.all(chainInfos.map(chain => {
        return getChannelForChain(chain.chainId, connextNode)
          .then(channelRes => channelRes.getValue())
          .then((channel) => {

            // capacity per coin
            return Promise.all(combined.map(coin => {
              const token = coin.data.find((d) => d.exchangeName === chain.exchangeName)
              return getRouterCapacity(
                getProvider(chain.rpcUrl),
                token, // toAssetId
                channel, // withdrawChannel
              ).then(result => {
                newRouters[chain.name][token.symbol] = result.routerOnchainBalance
                return newRouters
              })
            }))

          })
      }))
        .then(() => {
          console.log('newRouters', newRouters)
          setRouters(newRouters)
        })
    }
  }, [chainInfos, combined, connextNode])

  return (
    <Content>
      <h2>Network Overview</h2>

      {chainInfos.map(chain => (
        <div id={chain.name} key={chain.name}>
          <h3>{chain.name}</h3>
          <p>Balance</p>
          <ul>
            {Object.keys(balances[chain.name] || {}).map((key) => (
              <li key={key}>{parseFloat(balances[chain.name][key]).toFixed(3)} { key.toUpperCase()}</li>
            ))}
          </ul>
          <p>Router Capacity</p>
          <ul>
            {Object.keys(routers[chain.name] || {}).map((key) => (
              <li key={key}>{parseFloat(routers[chain.name][key]).toFixed(3)} { key.toUpperCase()}</li>
            ))}
          </ul>
        </div>
      ))}

    </Content>
  )
}

export default Overview
