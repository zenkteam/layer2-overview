import { ethers } from "ethers";
import _ from "lodash";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { ActionContainer, Button, Content, IconImage, Input, InternalLink, Link, Note, WarningContainer } from ".";
import { getChannelForChain, getRouterBalances, swap, verifyRouterCapacityForTransfer } from "../connext";
import { displayNumber, getProvider, getQuote, getTokenBalance } from "../utils";
import BlinkingValue from "./BlinkingValue";

export const SwapLinkContainer = styled.span`
  margin-right: 1em;
`;

function Swap({ chainId, chainInfos, combined, currentChain, account, connextNode, provider }) {
  const { from, to, symbol } = useParams();
  
  // Balances
  const [gettingBalance, setGettingBalance] = useState(false);
  const [fromTokenBalance, setFromTokenBalance] = useState(false);
  const [fromTokenPairBalance, setFromTokenPairBalance] = useState(false);
  const [toTokenBalance, setToTokenBalance] = useState(false);
  const [toTokenPairBalance, setToTokenPairBalance] = useState(false);

  // Connext Channels
  const [gettingChannels, setGettingChannels] = useState(false);
  const [toChannel, setToChannel] = useState(false);


  const [amount, setAmount] = useState(false);
  const [quote, setQuote] = useState(false);
  const [log, setLog] = useState([]);
  const [preTransferFromBalance, setPreTransferFromBalance] = useState(false);
  const [postTransferFromBalance, setPostTransferFromBalance] = useState(false);
  const [preTransferToBalance, setPreTransferToBalance] = useState(false);
  const [postTransferToBalance, setPostTransferToBalance] = useState(false);
  // const [preTransferBalance, setPreTransferBalance] = useState(false);
  // const [postTransferBalance, postPreTransferBalance] = useState(false);
  const [transferComplete, setTransferComplete] = useState(false);
  const [startTime, setStartTime] = useState(false);
  const [endTime, setEndTime] = useState(false);
  const [routerOnchainBalance, setRouterOnchainBalance] = useState(false);

  function setLogHandler(msg, option = {}) {
    let obj = { ...option, msg };
    console.log('***setLogHandler', { msg, option }, obj)
    setLog((_log) => [..._log, [msg, option.tx, option.chainId]]);
  }

  function getCurrentBalances() {
    getTokenBalance(fromExchange.rpcUrl, fromToken, account).then((b) => {
      setFromTokenBalance(b);
    });
    getTokenBalance(fromExchange.rpcUrl, fromTokenPair, account).then((b) => {
      setFromTokenPairBalance(b);
    });
    getTokenBalance(toExchange.rpcUrl, toToken, account).then((b) => {
      setToTokenBalance(b);
    });
    getTokenBalance(toExchange.rpcUrl, toTokenPair, account).then((b) => {
      setToTokenPairBalance(b);
    });
  }

  

  // parse/get swap direction and tokens
  const fromExchange = chainInfos.find((c) => c.exchangeName === from);
  const toExchange = chainInfos.find((c) => c.exchangeName === to);
  const fromSymbol = "USDC"
  let fromTokenData, toTokenData, fromToken, fromTokenPair, toToken, toTokenPair
  if (combined) {
    fromTokenData = combined.find((c) => c.symbol === fromSymbol);
    toTokenData = combined.find((c) => c.symbol === symbol);
    fromToken = fromTokenData.data.find((d) => d.exchangeName === from);
    fromTokenPair = toTokenData.data.find((d) => d.exchangeName === from);
    toToken = toTokenData.data.find((d) => d.exchangeName === to);
    toTokenPair = fromTokenData.data.find((d) => d.exchangeName === to);
  }

  if (connextNode && !gettingChannels) {
    setGettingChannels(true)
    getChannelForChain(toExchange.chainId, connextNode)
    .then(channelRes => channelRes.getValue())
    .then((channel) => {
      setToChannel(channel);
    });
  }

  if (combined && account && !gettingBalance) {
    setGettingBalance(true)
    getCurrentBalances()
  }

  // after the transfer has been completed
  let transferFromDiff, transferToDiff, totalDiff, percentage;
  if (postTransferFromBalance) {
    transferFromDiff = postTransferFromBalance - preTransferFromBalance;
    transferToDiff = postTransferToBalance - preTransferToBalance;
    totalDiff = transferFromDiff + transferToDiff;
    percentage = (totalDiff / amount) * 100;
  }

 
  useEffect(() => {
    if (log.length > 0) {
      getCurrentBalances()
      
      getRouterBalances({
        fromChain: fromExchange.chainId,
        toChain: toExchange.chainId,
        fromToken: fromToken.id,
        toToken: toToken.id,
        node: connextNode,
      }).then((b) => {
        console.log("***getRouterBalances0", b);
      });

      if (_.last(log)[0]?.match("7/7")) {
        getTokenBalance(fromExchange.rpcUrl, fromToken, account).then((b) => {
          setPostTransferFromBalance(b);
        });
        getTokenBalance(toExchange.rpcUrl, toTokenPair, account).then((b) => {
          setPostTransferToBalance(b);
        });
        setTransferComplete(true);
        setEndTime(moment());
      }
    }
    // eslint-disable-next-line
  }, [log]);

  ///???
  const firstQuote = quote[1];
  const isReadyToSwap =
    currentChain?.name === fromExchange?.name &&
    parseFloat(fromTokenBalance) - amount > 0 &&
    routerOnchainBalance - firstQuote?.formatted > 1;

  let number
  //console.log("****", { chainId, fromToken, toToken, isReadyToSwap });


  return (
    <Content style={{color: 'black'}}>
      <h3>
        <IconImage src={fromExchange.exchangeIcon} /> $USDC x ${symbol}
        <IconImage src={fromExchange.chainIcon} />-{">"}
        <IconImage src={toExchange.chainIcon} />${symbol} x $USDC
        <IconImage src={toExchange.exchangeIcon} />
      </h3>
      <Note style={{ fontSize: "small" }}>
        (
        {/* Does currently not refresh the balances
        <InternalLink to={`/exchanges/${to}-${from}/token/${symbol}`}>
          Switch Direction
        </InternalLink>
        | */}
        <InternalLink to={`/exchanges/${to}-${from}/tokeninfo/${symbol}`}>
          Info
        </InternalLink>
        )

      </Note>
      {chainId && fromToken && toToken && (
        <>
          Your token balance
          <ul>
            <li>
              <BlinkingValue value={displayNumber(fromTokenBalance)} /> $
              {fromSymbol} on {fromExchange.name}
            </li>
            <li>
              <BlinkingValue value={displayNumber(fromTokenPairBalance)} /> $
              {symbol} on {fromExchange.name}
            </li>
            {/* {preTransferBalance && (
              <li>
                In transit: {preTransferBalance} and {postPreTransferBalance}
              </li>
            )} */}
            <li>
              <BlinkingValue value={displayNumber(toTokenBalance)} /> ${symbol}{" "}
              on {toExchange.name}
            </li>
            <li>
              <BlinkingValue value={displayNumber(toTokenPairBalance)} /> $
              {fromSymbol} on {toExchange.name}
            </li>
          </ul>
        </>
      )}
      <>
        {fromToken && toToken && (
          <>
            {toToken && toChannel ? (
              <>
                Type the amount you want to swap
                <Input
                  placeholder="0.0"
                  onChange={(e) => {
                    number = parseFloat(e.target.value);
                    console.log("***BEFORE", e.target.value, {
                      fromExchange,
                      fromToken,
                      toToken,
                      number,
                    });
                    setAmount(number);
                    if (toChannel && number > 0) {
                      getQuote(
                        fromExchange,
                        toExchange,
                        fromToken,
                        fromTokenPair,
                        toToken,
                        toTokenPair,
                        number
                      ).then((c) => {
                        console.log("***getQuote3", { c });
                        setQuote(c);
                        verifyRouterCapacityForTransfer(
                          getProvider(toExchange.rpcUrl),
                          toToken, // toAssetId,
                          toChannel, // withdrawChannel,//
                          number, // amount
                          { hardcodedRate: 1 } //swap
                        ).then((b) => {
                          console.log(displayNumber(b.routerOnchainBalance));
                          setRouterOnchainBalance(b.routerOnchainBalance);
                        });
                      });
                    }
                  }}
                ></Input>
                {quote && (
                  <>
                    {displayNumber(quote[0].formatted)} ${fromSymbol} is{" "}
                    {displayNumber(quote[1].formatted)} ${symbol} on{" "}
                    {fromExchange.name} <br />
                    {displayNumber(quote[2].formatted)} ${symbol} is{" "}
                    {displayNumber(quote[3].formatted)} ${fromSymbol} on{" "}
                    {toExchange.name} <br />
                    <Note>
                      Profit Estimate:
                      <BlinkingValue
                        value={`${displayNumber(
                          quote[3].formatted - quote[0].formatted,
                          5
                        )} ${fromSymbol} (${displayNumber(
                          ((quote[3].formatted - quote[0].formatted) / amount) *
                          100
                        )}%)`}
                      />
                    </Note>
                    Swap limit: {displayNumber(routerOnchainBalance)} ${symbol}{" "}
                    on {fromExchange.name}(
                    {displayNumber(routerOnchainBalance - quote[1].formatted)})
                    {isReadyToSwap && (
                      <Note style={{ color: "orange", fontSize: "large" }}>
                        This is a demo dapp. Read{" "}
                        <InternalLink to="/about">
                          Risk and limitation
                        </InternalLink>{" "}
                        before you interact
                      </Note>
                    )}
                    <ActionContainer>
                      {currentChain?.name === fromExchange?.name ? (
                        parseFloat(fromTokenBalance) - amount > 0 ? (
                          routerOnchainBalance - quote[1].formatted > 1 ? (
                            <>
                              <WarningContainer>
                                {/* Swap button is temporarily disabled due to a bug */}

                                <Button
                                  onClick={(e) => {
                                    // const rawAmount = ethers.utils.parseUnits(amount.toString(), fromToken.decimals)
                                    console.log({
                                      fromExchange,
                                      toExchange,
                                      fromToken,
                                      fromTokenPair,
                                      toToken,
                                      toTokenPair,
                                    });
                                    // debugger
                                    const normalizedAmount = ethers.utils.parseUnits(
                                      amount.toString(),
                                      Number(fromToken.decimals)
                                    );
                                    console.log(
                                      `amount: ${amount}, normalizedAmount: ${normalizedAmount}`
                                    );
                                    // setPreTransferFromBalance
                                    // postTransferFromBalance, setPostTransferFromBalance] = useState(false);
                                    // const [preTransferToBalance, setPreTransferToBalance] = useState(false);
                                    // const [postTransferToBalance, setPostTransferToBalance] = useState(false);
                                    getTokenBalance(
                                      fromExchange.rpcUrl,
                                      fromToken,
                                      account
                                    ).then((b) => {
                                      setPreTransferFromBalance(b);
                                    });
                                    getTokenBalance(
                                      toExchange.rpcUrl,
                                      toTokenPair,
                                      account
                                    ).then((b) => {
                                      setPreTransferToBalance(b);
                                    });

                                    swap(
                                      normalizedAmount,
                                      fromToken.id,
                                      fromTokenPair.id,
                                      toToken.id,
                                      toTokenPair.id,
                                      fromExchange.chainId,
                                      toExchange.chainId,
                                      connextNode,
                                      provider,
                                      setLogHandler
                                    );
                                    setTransferComplete(false);
                                    setStartTime(moment());
                                  }}
                                >
                                  Swap
                                </Button>
                              </WarningContainer>
                            </>
                          ) : (
                            <Note>
                              Not enough capacity on Router. Please lower the
                              amount{" "}
                            </Note>
                          )
                        ) : (
                          <Note>
                            Not enough ${fromSymbol} on {fromExchange.name} to
                            Continue{" "}
                          </Note>
                        )
                      ) : (
                        <>
                          <Note>
                            Please connect to {fromExchange?.name} network and
                            refresh the page{" "}
                          </Note>
                          <Note
                            style={{ fontSize: "large", textAlign: "center" }}
                          >
                            (
                            <Link href={fromExchange.instructionGuide}>
                              Guide:How to add the network to Metamask
                            </Link>
                            )
                          </Note>
                        </>
                      )}
                    </ActionContainer>
                    {log.length > 0 && (
                      <div>
                        <Note style={{ color: "orange" }}>
                          Do not refresh this page!!!
                        </Note>
                        <ul>
                          {log.map(([msg, tx, chainId]) => {
                            let c = chainInfos.filter(
                              (c) => c.chainId === chainId
                            )[0];
                            console.log("****setLog", {
                              c,
                              chainId,
                              chainInfos,
                            });
                            return (
                              <li>
                                <BlinkingValue value={msg} />
                                {tx && (
                                  <Link href={`${c?.explorerUrl}/tx/${tx}`}>
                                    {tx.slice(0, 5)}...
                                  </Link>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                        {transferComplete && (
                          <ul>
                            <li>
                              Time spent: {endTime.diff(startTime, "second")}{" "}
                              seconds
                            </li>
                            <li>
                              Total difference: {displayNumber(totalDiff)} $
                              {fromSymbol} ({displayNumber(percentage, 3)} %)
                              {totalDiff > 0 ? "😸" : "😿"}
                            </li>
                            <li>
                              {fromExchange.name}:{" "}
                              {displayNumber(preTransferFromBalance)} -{" "}
                              {displayNumber(postTransferFromBalance)} ={" "}
                              {displayNumber(transferFromDiff)}
                            </li>
                            <li>
                              {toExchange.name}:{" "}
                              {displayNumber(preTransferToBalance)} -{" "}
                              {displayNumber(postTransferToBalance)} ={" "}
                              {displayNumber(transferToDiff)}
                            </li>
                          </ul>
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              "Loading..."
            )}
          </>
        )}
      </>
    </Content>
  );
}
export default Swap;
