import * as d3 from "d3";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Button, Content, IconImage } from '.';
import connext from "../assets/connext.png";
import { getChannelForChain, getRouterCapacity } from "../connext";
import { getProvider, getTokenBalance } from "../utils";
import WalletButton from './WalletButton';
import { ConnextModal } from '@connext/vector-modal';

export const Bubble = styled.foreignObject`
  background: gray;
  border-radius: 50%;
  text-align: center;
  color: black;
  display: flex;
  padding: 10px;
  box-shadow: 1px 1px 3px 0px gray;
  border: 4px solid rgba(27, 6, 6, 0.5);
  cursor: pointer;
  opacity: 0.95;
  font-size: 16px;

  &:hover {
    opacity: 1.0;
  }

  .icon {
    margin: auto;
    height: 40px;
    width: 40px;
    background: white;
    border-radius: 50%;
    font-size: 33px;

    img {
      margin: auto;
    }
  }

  h4 {
    font-size: 20px;
  }

  .subheader {
    margin-bottom: 6px;
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

function compare(a,b) {
  let fa = a.toLowerCase(),
      fb = b.toLowerCase();

  if (fa < fb) {
      return -1;
  }
  if (fa > fb) {
      return 1;
  }
  return 0;
}

function Overview({ chainInfos, combined, account, connextNode, provider, loadWeb3Modal, logoutOfWeb3Modal, initConnext }) {

  const [showModal, setShowModal] = useState(false);

  const currenciesToShow = [
    'USDC',
    'USDT',
    'DAI',

    // gas
    'BNB',
  ];

  function showCurrency(symbol) {
    return currenciesToShow.indexOf(symbol) !== -1;
  }

  // Balances
  const [balances, setBalances] = useState({})
  useEffect(() => {
    if (account) {
      const newBalances = {}
      const promises = []
      for (let i = 0; i < chainInfos.length; i++) {
        if (!newBalances[chainInfos[i].name]) {
          newBalances[chainInfos[i].name] = {}
        }

        // request balances
        for (const coin of chainInfos[i].tokenData) {
          promises.push(
            getTokenBalance(chainInfos[i].rpcUrl, coin, account)
              .then((balance) => {
                newBalances[chainInfos[i].name][coin.symbol] = balance
              })
              .catch(console.error)
          )
        }
      }

      // update state once
      Promise.all(promises).then(() => {
        setBalances(newBalances)
      })
    }
  }, [chainInfos, account])

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
            if (channel) {
              // capacity per coin
              return Promise.all(chain.tokenData.map(token => {
                return getRouterCapacity(
                  getProvider(chain.rpcUrl),
                  token, // toAssetId
                  channel, // withdrawChannel
                ).then(result => {
                  newRouters[chain.name][token.symbol] = result.routerOnchainBalance
                  return newRouters
                })
              }))
            }

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
    const outerForce = 180
    const innerForce = 300
    chainInfos.forEach(chain => {
      data.links.push({
        source: 'exchange_' + chain.name,
        target: 'chain_' + chain.name,
        distance: outerForce,
      })
    })
    chainInfos.forEach(chain => {
      data.links.push({
        source: 'chain_' + chain.name,
        target: 'router_' + chain.name,
        distance: outerForce,
      })
    })
    chainInfos.forEach((_, i) => {
      chainInfos.forEach((_, j) => {
        if (i < j) {
          data.links.push({
            source: 'router_' + chainInfos[i].name,
            target: 'router_' + chainInfos[j].name,
            distance: innerForce,
          })
          data.links.push({
            source: 'router_' + chainInfos[j].name,
            target: 'router_' + chainInfos[i].name,
            distance: innerForce,
          })
        }
      })
    })

    const graph = d3.select('#graph')

    var node = graph
      .selectAll('foreignObject')
      .data(data.nodes)
      .join("foreignObject")
      .attr("width", 200)
      .attr("height", 200)
      .call(d3.drag()  //sets the event listener for the specified typenames and returns the drag behavior.
        .on("start", dragstarted) //start - after a new pointer becomes active (on mousedown or touchstart).
        .on("drag", dragged)      //drag - after an active pointer moves (on mousemove or touchmove).
        .on("end", dragended)     //end - after an active pointer becomes inactive (on mouseup, touchend or touchcancel).
      );

    var link = graph
      .selectAll(".link")
      .data(data.links)
      .join("line")
      .style("stroke", "#aaa")
      .style("stroke-width", "6px")

    var simulation = d3.forceSimulation(data.nodes)
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

    // based on: 
    // - https://observablehq.com/@xianwu/simple-force-directed-graph-network-graph
    // - https://github.com/d3/d3-force
    // When the drag gesture starts, the targeted node is fixed to the pointer
    // The simulation is temporarily “heated” during interaction by setting the target alpha to a non-zero value.
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart(); // sets the current target alpha to the specified number in the range [0,1].
      d.fy = d.y; // fx - the node’s fixed x-position. Original is null.
      d.fx = d.x; // fy - the node’s fixed y-position. Original is null.
    }

    // When the drag gesture starts, the targeted node is fixed to the pointer
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    // the targeted node is released when the gesture ends
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

  }, [chainInfos])

  return (
    <Content>
      <svg id="graph" style={{ width: '100%', flexGrow: 1 }} xmlns="http://www.w3.org/2000/svg">

        {Array.apply(null, Array(chainInfos.length * 4)).map((_, i) => (
          <line className="link" key={i}></line>
        ))}

        <line className="link"></line>
        <line className="link"></line>
        <line className="link"></line>
        <line className="link"></line>

        {chainInfos.map((chain, i) => (
          <Bubble className="node" style={{ backgroundColor: chain.color }} id={'exchange-' + chain.name} key={chain.name}>
            <span className="icon">
              <IconImage src={chain.exchangeIcon} />
            </span>
            <h4>{chain.exchangeName}</h4>
            <span className="subheader">derivedETH * unitPrice:</span>

            <Balances>
              <tbody>
                {
                  chain.currentTokenData ? chain.currentTokenData.filter(coin => showCurrency(coin.symbol)).sort((a,b) => compare(a.symbol, b.symbol)).map((coin) => (
                    <tr key={coin.symbol}>
                      <td className="amount">{(coin.derivedETH * chain.unitPrice).toFixed(3)}</td>
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
            <span className="subheader">Your balance:</span>

            { account &&
              <Balances>
                <tbody>
                  {Object.keys(balances[chain.name] || {}).filter(key => showCurrency(key)).sort().map((key) => (
                    <tr key={key}>
                      <td className="amount">{parseFloat(balances[chain.name][key]).toFixed(3)}</td>
                      <td className="symbol">{key.toUpperCase()}</td>
                    </tr>
                  ))}
                </tbody>
              </Balances>
            }
            { !account &&
              <WalletButton
                provider={provider}
                loadWeb3Modal={loadWeb3Modal}
                logoutOfWeb3Modal={logoutOfWeb3Modal}
              />
            }
          </Bubble>
        ))}

        {chainInfos.map(chain => (
          <Bubble className="node" style={{ backgroundColor: chain.color }} id={'router-' + chain.name} key={chain.name}>
            <span className="icon">
              <IconImage src={connext} />
            </span>
            <h4>Router</h4>
            <span className="subheader">Capacity on chain:</span>

            { connextNode && 
              <Balances>
                <tbody>
                  {Object.keys(routers[chain.name] || {}).filter(key => showCurrency(key)).sort().map((key) => (
                    <tr key={key}>
                      <td className="amount">{parseFloat(routers[chain.name][key]).toFixed(3)}</td>
                      <td className="symbol">{key.toUpperCase()}</td>
                    </tr>
                  ))}
                </tbody>
              </Balances>
            }
            { !connextNode &&
              <Button
                onClick={() => initConnext()}
              >
                Connect Connext
              </Button>
            }
          </Bubble>
        ))}

      </svg>

      <Button onClick={() => setShowModal(true)}>Move between chains</Button>

      <div style={{'color': 'black'}}>
        <ConnextModal
          showModal={showModal}
          onClose={() => setShowModal(false)}
          onReady={params => console.log('MODAL IS READY =======>', params)}
          routerPublicIdentifier={"vector892GMZ3CuUkpyW8eeXfW2bt5W73TWEXtgV71nphXUXAmpncnj8"}
          loginProvider={window.ethereum}
          injectedProvider={window.ethereum}

          depositAssetId={'0x55d398326f99059ff775485246999027b3197955'}
          depositChainId={56}
          depositChainProvider={"https://bsc-dataseed1.defibit.io"}

          withdrawalAddress={'0x65f6F29D3eb871254d71A79CC4F74dB3AAF3b86e'}
          withdrawAssetId={'0x4ecaba5870353805a9f068101a40e0f32ed605c6'}
          withdrawChainId={100}
          withdrawChainProvider={"https://rpc.xdaichain.com"}
        />
      </div>
    </Content>
  )
}

export default Overview
