import React, { useEffect, useState } from "react";
import { useQuery } from "@apollo/react-hooks";
import {
  HashRouter as Router,
  Switch,
  Route,
  Link,
} from "react-router-dom";
import { ethers } from "ethers";

import { Button, Header, NetworkContainer } from "./components";
import Home from "./components/Home";
import Token from "./components/Token";
import Swap from "./components/Swap";
import Info from "./components/Info";
import User from "./components/User";
import About from "./components/About";
import useWeb3Modal from "./hooks/useWeb3Modal";
import { getBalance, getProvider, getBNB, getEth, getDai } from "./utils"
import pancakeData from './data/pancake.json'
import honeyData from './data/honey.json'
import quickData from './data/quick.json'
import { TOKEN_DATA } from "./graphql/subgraph";
import { initNode } from "./connext";

// login/logout wallet
function WalletButton({ provider, loadWeb3Modal, logoutOfWeb3Modal }) {
  return (
    <Button
      onClick={() => {
        if (!provider) {
          loadWeb3Modal();
        } else {
          logoutOfWeb3Modal();
        }
      }}
    >
      {!provider ? "Connect Wallet" : "Disconnect Wallet"}
    </Button>
  );
}

function App({ chainInfos }) {
  const [bnbPrice, setBnbPrice] = useState(false);
  const [ethPrice, setEthPrice] = useState(false);
  const [daiPrice, setDaiPrice] = useState(false);
  
  const [combined, setCombined] = useState(false);
  const [node, setNode] = useState(false);

  const [gettingChain, setGettingChain] = useState(false);
  const [account, setAccount] = useState(false);
  const [balance, setBalance] = useState(false);
  const [chainId, setChainId] = useState(false);
  const [currentChain, setCurrentChain] = useState(false);

  useEffect(() => {

    function getCoinPrices() {
      getBNB().then(r => {
        setBnbPrice(r.binancecoin.usd)
        chainInfos[0].unitPrice = r.binancecoin.usd
      })
      getEth().then(r => {
        setEthPrice(r.ethereum.usd)
        chainInfos[1].unitPrice = r.ethereum.usd
      })
      getDai().then(r => {
        setDaiPrice(r.dai.usd)
        chainInfos[2].unitPrice = r.dai.usd
      })
    }

    function getSwapPrices() {
      Promise.all(chainInfos.map(chain => {
        return chain.client.query({
          query: TOKEN_DATA,
          variables: {
            tokenIds: chain.tokenData.map(t => t.id)
          },
        })
      }))
      .then(graphData => {
        let combined = []
        for (const token0 of graphData[0].data.tokens) {
          for (const token1 of graphData[1].data.tokens) {
            for (const token2 of graphData[2].data.tokens) {
              if (token0.symbol === token1.symbol && token0.symbol === token2.symbol) {
                combined.push({
                  symbol: token0.symbol,
                  data: [token0, token1, token2]
                })
              }
            }
          }
        }
        setCombined(combined)
      });
    }

    async function init() {
      try {
        const _node = await initNode()
        setNode(_node)
      } catch (e) {
        console.log('Initiation error', { e })
      }
    }

    getCoinPrices()
    getSwapPrices()
    //init();
  }, []);

  function getUsersChain() {
    let _chainId, _currentChain, _account, _balance

    setGettingChain(true)
    provider.getNetwork()
      .then(({ chainId }) => {
        _chainId = chainId
        _currentChain = chainInfos.find(c => c.chainId === chainId)
      })
      .then(() => provider.listAccounts().then(a => {
          _account = a[0]
      }))
      .then(() => getBalance(_currentChain.rpcUrl, _account).then(b => {
        _balance = ethers.utils.formatEther(b)
      }))
      .then(() => {
        setChainId(_chainId)
        setCurrentChain(_currentChain)
        setAccount(_account)
        setBalance(_balance)
      })
  }


  // connect to a specific network?
  let networkName
  // if (window.location.href.match(/\/exchanges\/Quick/)) {
  //   networkName = 'matic'
  // } else if (window.location.href.match(/\/exchanges\/Honey/)) {
  //   networkName = 'xdai'
  // } else if (window.location.href.match(/\/exchanges\/Pancake/)) {
  //   networkName = 'bsc'
  // }
  const [provider, loadWeb3Modal, logoutOfWeb3Modal] = useWeb3Modal({
    NETWORK: networkName
  });
  window.provider = provider // ???
  window.ethers = ethers // ???

  if (provider && !gettingChain) {
    getUsersChain()
  }

  const balanceToDisplay = balance ? parseFloat(balance).toFixed(2) : '-'

  return (
    <h1></h1>
    // <Router>
    //   <div>
    //     <Header>
    //       <Link
    //         to={`/`}
    //         style={{ textDecoration: "none", fontSize: "xx-large" }}
    //       >
    //         🐰
    //       </Link>
    //       <NetworkContainer>
    //         <>
    //           <Link to='/about' >About</Link>
    //           {chainId && (
    //             (currentChain) ? (
    //               <div>
    //                 Connected to {currentChain.name} as
    //                 <Link
    //                   to={`/user/${userName || account}`}
    //                 >
    //                   {userName || `${account?.slice(0, 5)}...`}
    //                 </Link> (
    //                 {balanceToDisplay} ${currentChain.tokenSymbol})
    //               </div>
    //             ) : (`Unsupported Network`)
    //           )}
    //           <WalletButton
    //             provider={provider}
    //             loadWeb3Modal={loadWeb3Modal}
    //             logoutOfWeb3Modal={logoutOfWeb3Modal}
    //           />
    //         </>
    //       </NetworkContainer>
    //     </Header>
    //     <Switch>
    //       <Route path="/token/:symbol">
    //         <Token chainInfos={chainInfos} combined={combined} />
    //       </Route>
    //       <Route path="/exchanges/:from-:to/token/:symbol">
    //         <Swap
    //           chainId={chainId}
    //           chainInfos={chainInfos}
    //           currentChain={currentChain}
    //           combined={combined}
    //           account={account}
    //           connextNode={node}
    //           provider={provider}
    //         />
    //       </Route>
    //       <Route path="/exchanges/:from-:to/tokeninfo/:symbol">
    //         <Info
    //           chainId={chainId}
    //           chainInfos={chainInfos}
    //           currentChain={currentChain}
    //           combined={combined}
    //           account={account}
    //           connextNode={node}
    //           provider={provider}
    //         />
    //       </Route>
    //       <Route path="/about">
    //         <About />
    //       </Route>
    //       <Route path="/user/:account">
    //         <User
    //           pancakeData={pancakeData}
    //           honeyData={honeyData}
    //           quickData={quickData}
    //           chainInfos={chainInfos}
    //           connextNode={node}
    //           account={account}
    //         />
    //       </Route>
    //       <Route path="/">
    //         <Home chainInfos={chainInfos} combined={combined} />
    //       </Route>
    //     </Switch>
    //   </div>
    // </Router>
  );
}

export default App;
