import * as d3 from "d3";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Content, IconImage } from '.';
import connext from "../assets/connext.png";
import { getChannelForChain, getRouterCapacity } from "../connext";
import { getProvider, getTokenBalance } from "../utils";

export const Bubble = styled.foreignObject`
  background: gray;
  border-radius: 50%;
  text-align: center;
  color: black;
  display: flex;
  padding: 10px;
  box-shadow: 1px 1px 3px 0px black;

  .icon {
    margin: auto;
    height: 40px;
    width: 40px;
    background: white;
    border-radius: 50%;

    img {
      margin: auto;
    }
  }
`;

export const Balances = styled.table`
  font-size: 16px;
  margin: auto;
  font-family: monospace;

  .amount {
    text-align: right;
  }
  .symbol {
    text-align: left;
  }
`;

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
          setRouters(newRouters)
        })
    }
  }, [chainInfos, combined, connextNode])

  useEffect(() => {
    const data = {
      nodes: [],
      links: [],
    }

    // nodes
    chainInfos.forEach(chain => {
      data.nodes.push({
        id: 'exchange_' + chain.name
      })
    })
    chainInfos.forEach(chain => {
      data.nodes.push({
        id: 'chain_' + chain.name
      })
    })
    chainInfos.forEach(chain => {
      data.nodes.push({
        id: 'router_' + chain.name
      })
    })

    // links
    chainInfos.forEach(chain => {
      data.links.push({
        source: 'exchange_' + chain.name,
        target: 'chain_' + chain.name,
        distance: 150,
      })
    })
    chainInfos.forEach(chain => {
      data.links.push({
        source: 'chain_' + chain.name,
        target: 'router_' + chain.name,
        distance: 150,
      })
    })
    chainInfos.forEach((chain, i) => {
      data.links.push({
        source: 'router_' + chainInfos[i].name,
        target: 'router_' + chainInfos[(i + 1) % chainInfos.length].name,
        distance: 400,
      })
      data.links.push({
        source: 'router_' + chainInfos[(i + 1) % chainInfos.length].name,
        target: 'router_' + chainInfos[i].name,
        distance: 400,
      })
    })

    const graph = d3.select('#graph')

    var node = graph
      .selectAll('foreignObject')
      .data(data.nodes)
      .join("foreignObject")
      .attr("width", 200)
      .attr("height", 200)

    var link = graph
      .selectAll(".link")
      .data(data.links)
      .join("line")
      .style("stroke", "#aaa")
      .style("stroke-width", "6px")

    d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links)
        .id(function (d) { return d.id; })
        .distance((link) => link.distance)
      )
      .force("charge", d3.forceManyBody().strength(-1000))
      .force("center", d3.forceCenter(
        graph._groups[0][0].width.animVal.value / 2,
        graph._groups[0][0].height.animVal.value / 2
      ))
      .on("tick", ticked)

    function ticked() {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y)

      node
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.y)
        .style("transform", "translate(-100px, -100px)")
    }

  }, [chainInfos])

  return (
    <Content>
      <svg id="graph" style={{ width: '100%', flexGrow: 1 }} xmlns="http://www.w3.org/2000/svg">

        {Array.apply(null, Array(chainInfos.length * 4)).map((_, i) => (
          <line className="link" key={i}></line>
        ))}

        {chainInfos.map((chain, i) => (
          <Bubble className="node" style={{ backgroundColor: chain.color }} id={'exchange-' + chain.name} key={chain.name}>
            <span className="icon">
              <IconImage src={chain.exchangeIcon} />
            </span>
            <h4>{chain.exchangeName}</h4>
            <Balances>
              <tbody>
                {
                  combined ? combined.map((coin) => (
                    <tr key={coin.symbol}>
                      <td className="amount">{coin.data[i] ? (coin.data[i].derivedETH * chain.unitPrice).toFixed(3) : 'N/A'}</td>
                      <td className="symbol">{coin.symbol.toUpperCase()}</td>
                    </tr>
                  )) : <tr></tr>
                }
              </tbody>
            </Balances>
          </Bubble>
        ))}

        {chainInfos.map(chain => (
          <Bubble className="node" style={{ backgroundColor: chain.color }} id={'chain-' + chain.name} key={chain.name}>
            <span className="icon">
              <IconImage src={chain.chainIcon} />
            </span>
            <h4>{chain.name}</h4>
            <Balances>
              <tbody>
                {Object.keys(balances[chain.name] || {}).map((key) => (
                  <tr key={key}>
                    <td className="amount">{parseFloat(balances[chain.name][key]).toFixed(3)}</td>
                    <td className="symbol">{key.toUpperCase()}</td>
                  </tr>
                ))}
              </tbody>
            </Balances>
          </Bubble>
        ))}

        {chainInfos.map(chain => (
          <Bubble className="node" style={{ backgroundColor: chain.color }} id={'router-' + chain.name} key={chain.name}>
            <span className="icon">
              <IconImage src={connext} />
            </span>
            <h4>Router</h4>
            <Balances>
              <tbody>
                {Object.keys(routers[chain.name] || {}).map((key) => (
                  <tr key={key}>
                    <td className="amount">{parseFloat(routers[chain.name][key]).toFixed(3)}</td>
                    <td className="symbol">{key.toUpperCase()}</td>
                  </tr>
                ))}
              </tbody>
            </Balances>
          </Bubble>
        ))}

      </svg>
    </Content>
  )
}

export default Overview
