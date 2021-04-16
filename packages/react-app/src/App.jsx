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
  const [chainId, setChainId] = useState(false);
  const [currentChain, setCurrentChain] = useState(false);
  const [account, setAccount] = useState(false);
  const [balance, setBalance] = useState(false);

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
    
    //getSwapPrices()
    // or
    setCombined(JSON.parse('[{"symbol":"USDT","data":[{"id":"0x55d398326f99059ff775485246999027b3197955","symbol":"USDT","decimals":"18","totalLiquidity":"66004305.47905436485942807","tradeVolumeUSD":"1310270178.172442484839581037561807","untrackedVolumeUSD":"1310302622.687434687065091581662219","txCount":"1087927","derivedETH":"0.003770548625431343654424542122373305","__typename":"Token"},{"id":"0xc2132d05d31c914a87c6611c10748aeb04b58e8f","symbol":"USDT","decimals":"6","totalLiquidity":"993841.534778","tradeVolumeUSD":"11702117.83615530485129497369677858","untrackedVolumeUSD":"11701424.92170340883501959339614237","txCount":"262966","derivedETH":"0.0004096442001090171503546084037789485","__typename":"Token"},{"id":"0x4ecaba5870353805a9f068101a40e0f32ed605c6","symbol":"USDT","decimals":"6","totalLiquidity":"3122.792543","tradeVolumeUSD":"112643.9758563794998914719992193421","untrackedVolumeUSD":"112615.3854549415179372220008842255","txCount":"23091","derivedETH":"0.9953367595668173596250015955476553","__typename":"Token"}]},{"symbol":"USDC","data":[{"id":"0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d","symbol":"USDC","decimals":"18","totalLiquidity":"21084343.266658233210608017","tradeVolumeUSD":"153617067.3873165795756984065490748","untrackedVolumeUSD":"153987173.335615702595345046554446","txCount":"105763","derivedETH":"0.003802867040657496994274796701116416","__typename":"Token"},{"id":"0x2791bca1f2de4661ed88a30c99a7a9449aa84174","symbol":"USDC","decimals":"6","totalLiquidity":"12350381.864713","tradeVolumeUSD":"414000735.7539136795760309942653261","untrackedVolumeUSD":"413986503.3172441474554081103621614","txCount":"1455858","derivedETH":"0.0004106878126962225773032908552546908","__typename":"Token"},{"id":"0xddafbb505ad214d7b80b1f830fccc89b60fb7a83","symbol":"USDC","decimals":"6","totalLiquidity":"125666.71452","tradeVolumeUSD":"1892553.832439699607978498401040495","untrackedVolumeUSD":"1892573.975065954038788211228043751","txCount":"75758","derivedETH":"0.9939518452194338551583388804001622","__typename":"Token"}]},{"symbol":"DAI","data":[{"id":"0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3","symbol":"DAI","decimals":"18","totalLiquidity":"22821462.317068565482948697","tradeVolumeUSD":"95384623.84126241383801687545160023","untrackedVolumeUSD":"97452644.22850938866626671753923445","txCount":"249235","derivedETH":"0.003803439611359656275605029640539249","__typename":"Token"},{"id":"0x8f3cf7ad23cd3cadbd9735aff958023239c6a063","symbol":"DAI","decimals":"18","totalLiquidity":"812189.402896800510373935","tradeVolumeUSD":"20266094.13018015917741764310056088","untrackedVolumeUSD":"20266142.06071511828721416174733772","txCount":"239412","derivedETH":"0.0004125316748418151101606267668543362","__typename":"Token"},{"id":"0x44fa8e6f47987339850636f88629646662444217","symbol":"DAI","decimals":"18","totalLiquidity":"645.754229008717559715","tradeVolumeUSD":"47091.0240856983408030961402827338","untrackedVolumeUSD":"52771.09297549392803189569124049334","txCount":"26607","derivedETH":"0.9897437693228687480283825407165215","__typename":"Token"}]}]'))
    
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
      // .then(() => {
      //   const mainnetProvider = getProvider()
      //   mainnetProvider.lookupAddress(_account).then((name)=>{
      //     setUserName(name)
      //   })
      // })
      .then(() => {
        if (_currentChain) {
          return getBalance(_currentChain.rpcUrl, _account).then(b => {
            _balance = ethers.utils.formatEther(b)
          })
        }
      })
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
    <Router>
      <div>
        <Header>
          <Link
            to={`/`}
            style={{ textDecoration: "none", fontSize: "xx-large" }}
          >
            🐰
          </Link>
          <NetworkContainer>
            <>
              <Link to='/about' >About</Link>
              {chainId && (
                (currentChain && account) ? (
                  <div>
                    Connected to {currentChain.name} as
                    <Link
                      to={`/user/${account}`}
                    >
                      {`${account?.slice(0, 5)}...`}
                    </Link> (
                    {balanceToDisplay} ${currentChain.tokenSymbol})
                  </div>
                ) : (`Unsupported Network`)
              )}
              <WalletButton
                provider={provider}
                loadWeb3Modal={loadWeb3Modal}
                logoutOfWeb3Modal={logoutOfWeb3Modal}
              />
            </>
          </NetworkContainer>
        </Header>
        <Switch>
          <Route path="/token/:symbol">
            <Token chainInfos={chainInfos} combined={combined} />
          </Route>
          <Route path="/exchanges/:from-:to/token/:symbol">
            <Swap
              chainId={chainId}
              chainInfos={chainInfos}
              currentChain={currentChain}
              combined={combined}
              account={account}
              connextNode={node}
              provider={provider}
            />
          </Route>
          <Route path="/exchanges/:from-:to/tokeninfo/:symbol">
            <Info
              chainId={chainId}
              chainInfos={chainInfos}
              currentChain={currentChain}
              combined={combined}
              account={account}
              connextNode={node}
              provider={provider}
            />
          </Route>
          <Route path="/about">
            <About />
          </Route>
          <Route path="/user/:account">
            <User
              pancakeData={pancakeData}
              honeyData={honeyData}
              quickData={quickData}
              chainInfos={chainInfos}
              connextNode={node}
              account={account}
            />
          </Route>
          <Route path="/">
            <Home chainInfos={chainInfos} combined={combined} />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

export default App;
