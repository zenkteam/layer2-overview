import { useQuery } from "@apollo/react-hooks";
import moment from "moment";
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import {
  Content,
  IconImage,
  InternalLink, Note,
  Title
} from ".";
import { GET_HOUR_DATA } from "../graphql/subgraph";
import Chart from "./Chart";

export const SwapLinkContainer = styled.span`
  margin-right: 1em;
`;

function parseData(data, key) {
  return (
    (data &&
      data.tokenDayDatas &&
      data.tokenDayDatas.map((d) => {
        let r = {
          date: moment(parseInt(d.date) * 1000).format("MMM Do kk:mm:ss"),
        };
        r[`${key}Volume`] = parseInt(d.dailyVolumeUSD);
        r[`${key}Liquidity`] = parseInt(d.totalLiquidityUSD);
        r[`${key}Price`] = parseFloat(d.priceUSD);
        return r;
      })) ||
    []
  );
}

function Info({
  chainInfos,
  combined,
}) {
  const { from, to, symbol } = useParams();

  useEffect(() => { }, []);

  const fromExchange = chainInfos.filter((c) => c.exchangeName === from)[0];
  const toExchange = chainInfos.filter((c) => c.exchangeName === to)[0];

  let fromTokenData,
    toTokenData,
    fromToken,
    fromTokenPair,
    toToken,
    toTokenPair;
  const fromSymbol = "USDC";
  if (combined.length > 0) {
    fromTokenData = combined.filter((c) => c.symbol === fromSymbol)[0];
    toTokenData = combined.filter((c) => c.symbol === symbol)[0];
    fromToken = fromTokenData.data?.filter((d) => d?.exchangeName === from)[0];
    fromTokenPair = toTokenData.data?.filter(
      (d) => d?.exchangeName === from
    )[0];
    toToken = toTokenData.data?.filter((d) => d?.exchangeName === to)[0];
    toTokenPair = fromTokenData.data?.filter((d) => d?.exchangeName === to)[0];
  }
  console.log("******", {
    fromToken,
    fromTokenPair,
    toToken,
    toTokenPair,
  });
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
  if (chainInfos && chainInfos.length > 0) {
  } else {
    return "";
  }

  let historyData = [],
    historyData1,
    historyData2,
    num;
  historyData1 = parseData(fromData, fromTokenPair?.exchangeName);
  historyData2 = parseData(toData, toToken?.exchangeName);
  console.log("***history", {
    fromTokenPair,
    toToken,
    historyData,
    historyData1,
    historyData2,
  });
  if (historyData1?.length > 0 || historyData2?.length > 0) {
    let totalLength;
    if (historyData2?.length > historyData1?.length) {
      totalLength = historyData2?.length;
    } else {
      totalLength = historyData1?.length;
    }
    for (let index = 0; index < totalLength; index++) {
      const d2 = historyData2[index] || {};
      const d1 = historyData1[index] || {};
      let pctDiff;
      if (d1 && d2) {
        // debugger

        const diff =
          d1[`${fromTokenPair?.exchangeName}Price`] -
          d2[`${toToken?.exchangeName}Price`];
        const mid =
          (d1[`${fromTokenPair?.exchangeName}Price`] +
            d2[`${toToken?.exchangeName}Price`]) /
          2;
        pctDiff = (diff / mid) * 100;
        if (pctDiff > 30) pctDiff = 30;
        if (pctDiff < -30) pctDiff = -30;
      }
      historyData[index] = {
        ...d2,
        ...d1,
        ...{ pctDiff },
      };
    }
  }
  historyData = historyData.reverse();
  num = historyData.length;
  console.log("***his", { historyData, num });
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
        {historyData1.length === 0 && historyData2.length === 0 ? (
          "Loading..."
        ) : (
          <>
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
            {historyData2?.length === 0 && "(Mainnet data not available)"}
            <Chart
              data={historyData}
              xKey={"date"}
              yKeys={[
                `${fromTokenPair?.exchangeName}Price`,
                `${toToken?.exchangeName}Price`,
              ]}
            />
            <Chart data={historyData} xKey={"date"} yKeys={["pctDiff"]} />
            <Chart
              data={historyData}
              xKey={"date"}
              brush={true}
              yKeys={[
                `${fromTokenPair?.exchangeName}Volume`,
                `${toToken?.exchangeName}Volume`,
              ]}
            />
            <Chart
              data={historyData}
              xKey={"date"}
              yKeys={[
                `${fromTokenPair?.exchangeName}Liquidity`,
                `${toToken?.exchangeName}Liquidity`,
              ]}
            />
          </>
        )}
      </Content>
    </>
  );
}
export default Info;
