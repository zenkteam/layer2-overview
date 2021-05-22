import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import { HashRouter as Router, Link, Route, Switch } from "react-router-dom";
import { Header, NetworkContainer } from "./components";
import WalletButton from "./components/WalletButton";
import About from "./components/About";
import Home from "./components/Home";
import Info from "./components/Info";
import Overview from "./components/Overview";
import Swap from "./components/Swap";
import Token from "./components/Token";
import User from "./components/User";
import { initNode } from "./connext";
import honeyData from './data/honey.json';
import pancakeData from './data/pancake.json';
import quickData from './data/quick.json';
import { TOKEN_DATA } from "./graphql/subgraph";
import useWeb3Modal from "./hooks/useWeb3Modal";
import { getBalance, getPricesInUSD } from "./utils";

function App({ chainInfos }) {
  const [combined, setCombined] = useState(false);
  const [node, setNode] = useState(false);

  const [gettingChain, setGettingChain] = useState(false);
  const [chainId, setChainId] = useState(false);
  const [currentChain, setCurrentChain] = useState(false);
  const [account, setAccount] = useState(false);
  const [balance, setBalance] = useState(false);

  async function init() {
    try {
      const _node = await initNode()
      setNode(_node)
    } catch (e) {
      console.log('Initiation error', { e })
    }
  }

  useEffect(() => {

    function getCoinPrices() {
      return getPricesInUSD(chainInfos.map(chain => chain.derivedPriceCoin)).then(result => {
        for (let chain of chainInfos) {
          chain.unitPrice = result[chain.derivedPriceCoin].usd
        }
      })
    }

    // eslint-disable-next-line
    function getSwapPrices() {
      Promise.all(chainInfos.map(chain => {
        return chain.client.query({
          query: TOKEN_DATA,
          variables: {
            tokenIds: chain.tokenData.map(t => t.id)
          },
        }).then(result => {
          for (let token of result.data.tokens) {
            token.exchangeName = chain.exchangeName
          }
          chain.currentTokenData = result.data.tokens;
          return result
        })
      }))
        .then(graphData => {
          // let combined = {}
          // for (const chain of graphData) {
          //   for (const token of chain.data.tokens) {
          //     if (!combined[token.symbol]) {
          //       combined[token.symbol] = {}
          //     }
          //     combined[token.symbol][token.exchangeName] = token;
          //   }
          // }

          const combined = []
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
          console.log('combined:', JSON.stringify(combined));
          setCombined(combined)
        });
    }

    getCoinPrices()

    //getSwapPrices()
    // or
    setCombined(JSON.parse('[{"symbol":"USDT","data":[{"id":"0x55d398326f99059ff775485246999027b3197955","symbol":"USDT","decimals":"18","totalLiquidity":"66004305.47905436485942807","tradeVolumeUSD":"1310270178.172442484839581037561807","untrackedVolumeUSD":"1310302622.687434687065091581662219","txCount":"1087927","derivedETH":"0.003770548625431343654424542122373305","__typename":"Token","exchangeName":"Pancake"},{"id":"0xc2132d05d31c914a87c6611c10748aeb04b58e8f","symbol":"USDT","decimals":"6","totalLiquidity":"1050456.067232","tradeVolumeUSD":"12322308.62257436292403395091329778","untrackedVolumeUSD":"12321616.16662206055566638483450806","txCount":"267507","derivedETH":"0.0004011892852610486972268882969568704","__typename":"Token","exchangeName":"Quick"},{"id":"0x4ecaba5870353805a9f068101a40e0f32ed605c6","symbol":"USDT","decimals":"6","totalLiquidity":"3101.508109","tradeVolumeUSD":"114011.1338828091489842244728880387","untrackedVolumeUSD":"113982.5561430468705785926770507923","txCount":"23177","derivedETH":"1.022232979656368029350341118425712","__typename":"Token","exchangeName":"Honey"}]},{"symbol":"USDC","data":[{"id":"0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d","symbol":"USDC","decimals":"18","totalLiquidity":"21084343.266658233210608017","tradeVolumeUSD":"153617067.3873165795756984065490748","untrackedVolumeUSD":"153987173.335615702595345046554446","txCount":"105763","derivedETH":"0.003802867040657496994274796701116416","__typename":"Token","exchangeName":"Pancake"},{"id":"0x2791bca1f2de4661ed88a30c99a7a9449aa84174","symbol":"USDC","decimals":"6","totalLiquidity":"12468610.198727","tradeVolumeUSD":"419331818.0660844044674665805335779","untrackedVolumeUSD":"419318872.1572678706093478341639598","txCount":"1468483","derivedETH":"0.0004058695745216328778604380093562023","__typename":"Token","exchangeName":"Quick"},{"id":"0xddafbb505ad214d7b80b1f830fccc89b60fb7a83","symbol":"USDC","decimals":"6","totalLiquidity":"123674.763356","tradeVolumeUSD":"1945554.019022479890630928919384739","untrackedVolumeUSD":"1945575.025984343980551726624452506","txCount":"76414","derivedETH":"1.010822100609817860829304518943908","__typename":"Token","exchangeName":"Honey"}]},{"symbol":"DAI","data":[{"id":"0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3","symbol":"DAI","decimals":"18","totalLiquidity":"22821462.317068565482948697","tradeVolumeUSD":"95384623.84126241383801687545160023","untrackedVolumeUSD":"97452644.22850938866626671753923445","txCount":"249235","derivedETH":"0.003803439611359656275605029640539249","__typename":"Token","exchangeName":"Pancake"},{"id":"0x8f3cf7ad23cd3cadbd9735aff958023239c6a063","symbol":"DAI","decimals":"18","totalLiquidity":"858579.96649656395032642","tradeVolumeUSD":"20903814.55261839971137780148013643","untrackedVolumeUSD":"20903862.59415712978325629945188778","txCount":"243687","derivedETH":"0.0004036223155711257170217998857016074","__typename":"Token","exchangeName":"Quick"},{"id":"0x44fa8e6f47987339850636f88629646662444217","symbol":"DAI","decimals":"18","totalLiquidity":"648.219467643233612141","tradeVolumeUSD":"47155.7175139298901984161402827338","untrackedVolumeUSD":"52838.52202511951932060195266241079","txCount":"26678","derivedETH":"1.017644761389492178964452580025142","__typename":"Token","exchangeName":"Honey"}]}]'))

    init();
  }, [chainInfos]);

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
  // window.provider = provider // ???
  // window.ethers = ethers // ???

  if (provider && !gettingChain) {
    getUsersChain()
  }

  const balanceToDisplay = balance ? parseFloat(balance).toFixed(2) : '-'

  return (
    <Router>
      <div>
        {/* <Header>
          <NetworkContainer>
            <>
              <Link to='/overview' >Overview</Link>
              |
              <Link to='/about' >About</Link>
              |
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
        </Header> */}
        <NetworkContainer>
          <WalletButton
            provider={provider}
            loadWeb3Modal={loadWeb3Modal}
            logoutOfWeb3Modal={logoutOfWeb3Modal}
          />
        </NetworkContainer>
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
          <Route path="/swap">
            <Home chainInfos={chainInfos} combined={combined} />
          </Route>
          <Route path="/">
            <Overview
              chainInfos={chainInfos}
              combined={combined}
              account={account}
              connextNode={node}
              provider={provider}
              loadWeb3Modal={loadWeb3Modal}
              logoutOfWeb3Modal={logoutOfWeb3Modal}
              initConnext={init}
            />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

export default App;
