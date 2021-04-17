import { useQuery } from "@apollo/react-hooks";
import moment from "moment";
import React from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import {Content, IconImage, InternalLink, Note, Title} from ".";
import { GET_HOUR_DATA } from "../graphql/subgraph";
import Chart from "./Chart";

export const SwapLinkContainer = styled.span`
  margin-right: 1em;
`;

function parseData(data, key) {
  return data?.tokenDayDatas?.map((d) => {
    return {
      timestamp: d.date,
      date: moment(parseInt(d.date) * 1000).format("MMM Do kk:mm:ss"),
      [`${key}Volume`]: parseInt(d.dailyVolumeUSD),
      [`${key}Liquidity`]: parseInt(d.totalLiquidityUSD),
      [`${key}Price`]: parseFloat(d.priceUSD),
    };
  })
}

function Info({ chainInfos, combined }) {
  const { from, to, symbol } = useParams();
  
  // parse/get swap direction and tokens
  const fromExchange = chainInfos.find((c) => c.exchangeName === from);
  const toExchange = chainInfos.find((c) => c.exchangeName === to);
  const fromSymbol = "USDC";
  let fromTokenData, toTokenData, fromToken, fromTokenPair, toToken, toTokenPair;
  if (combined) {
    fromTokenData = combined.find((c) => c.symbol === fromSymbol);
    toTokenData = combined.find((c) => c.symbol === symbol);
    fromToken = fromTokenData.data.find((d) => d.exchangeName === from);
    fromTokenPair = toTokenData.data.find((d) => d.exchangeName === from);
    toToken = toTokenData.data.find((d) => d.exchangeName === to);
    toTokenPair = fromTokenData.data.find((d) => d.exchangeName === to);
  }

  // request historic data
  const { data: fromData } = useQuery(GET_HOUR_DATA, {
    client: fromExchange.client,
    variables: { tokenId: fromTokenPair?.id },
    skip: !fromTokenPair?.id,
  });
  const { data: toData } = useQuery(GET_HOUR_DATA, {
    client: toExchange.client,
    variables: { tokenId: toToken?.id },
    skip: !toToken?.id,
  });

  let historyData = []
  let historyData1 = []
  let historyData2 = []

  if (fromData && toData) {
    historyData1 = parseData(fromData, fromTokenPair.exchangeName);
    historyData2 = parseData(toData, toToken.exchangeName);

    // FIXME: does not work right if date ranges are not the same
    let totalLength = Math.max(historyData1.length, historyData2.length)
    for (let index = 0; index < totalLength; index++) {
      const d1 = historyData1[index] || {};
      const d2 = historyData2[index] || {};
      let pctDiff = 0;
      if (d1 && d2) {
        const diff = d1[`${fromTokenPair.exchangeName}Price`] - d2[`${toToken.exchangeName}Price`]
        const mid = (d1[`${fromTokenPair.exchangeName}Price`] + d2[`${toToken.exchangeName}Price`]) / 2
        pctDiff = (diff / mid) * 100
        // limit range
        pctDiff = Math.min(pctDiff, 30)
        pctDiff = Math.max(pctDiff, -30)
      }
      historyData[index] = {
        ...d2,
        ...d1,
        ...{ pctDiff },
      };
    }
    historyData = historyData.reverse();
  }

  return (
    <>
      <Content>
        <Title>
          <IconImage src={fromExchange.exchangeIcon} />
          <IconImage src={fromExchange.chainIcon} />${symbol}
          <IconImage src={fromExchange.chainIcon} />-{">"}
          <IconImage src={toExchange.chainIcon} />${symbol}
          <IconImage src={toExchange.exchangeIcon} />
        </Title>

        <Note style={{ fontSize: "small", margin: "1em" }}>
          (
            <InternalLink to={`/exchanges/${to}-${from}/tokeninfo/${symbol}`}>
            Switch Direction
            </InternalLink>
            |
            <InternalLink to={`/exchanges/${to}-${from}/token/${symbol}`}>
            Swap
            </InternalLink>
          )

        </Note>
        
        {!historyData.length ? (
          "Loading..."
        ) : (
          <>
            <Chart
              data={historyData}
              xKey={"date"}
              yKeys={[
                `${fromTokenPair.exchangeName}Price`,
                `${toToken.exchangeName}Price`,
              ]}
            />
            <Chart 
              data={historyData} 
              xKey={"date"} 
              yKeys={["pctDiff"]}
            />
            <Chart
              data={historyData}
              xKey={"date"}
              brush={true}
              yKeys={[
                `${fromTokenPair.exchangeName}Volume`,
                `${toToken.exchangeName}Volume`,
              ]}
            />
            <Chart
              data={historyData}
              xKey={"date"}
              yKeys={[
                `${fromTokenPair.exchangeName}Liquidity`,
                `${toToken.exchangeName}Liquidity`,
              ]}
            />
          </>
        )}
      </Content>
    </>
  );
}
export default Info;
