import React from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { Content, IconImage, InternalLink } from ".";
export const SwapLinkContainer = styled.span`
  margin-right: 1em;
`;

function Token({ chainInfos, combined }) {
  let { symbol } = useParams();
  let tokenData, compared;

  if (combined) {
    tokenData = combined.filter((c) => c.symbol === symbol)[0];
    compared = chainInfos
      .map((c, i) => {
        return chainInfos.map((cc, ii) => {
          if (tokenData.data[i] && tokenData.data[ii] && c.name !== cc.name) {
            let cValue = tokenData.data[i].derivedETH * c.unitPrice;
            let ccValue = tokenData.data[ii].derivedETH * cc.unitPrice;
            //let diff = ((ccValue - cValue) / ((cValue + ccValue) / 2)) * 100;
            let diff = (ccValue - cValue) / cValue * 100;

            return {
              first: c,
              firstValue: cValue,
              second: cc,
              secondValue: ccValue,
              diff,
            }
          } else {
            return {}
          }
        })
      })
      .flat()
      .filter(compare => compare.diff > 0)
  }

  return (
    <Content>
      <h1>{symbol}</h1>
      <ul>
        {!compared ? (
          <p>Loading...</p>
        ) : (
          compared.map((compare) => (
            <li key={compare.first.exchangeIcon + compare.second.exchangeIcon}>
              <SwapLinkContainer>
                <IconImage src={compare.first.exchangeIcon} />${compare.firstValue.toFixed(2)}
                &nbsp; -{">"}
                <IconImage src={compare.second.exchangeIcon} />${compare.secondValue.toFixed(2)}
                (+{compare.diff.toFixed(2)} %)
              </SwapLinkContainer>
              <InternalLink
                to={`/exchanges/${compare.first.exchangeName}-${compare.second.exchangeName}/token/${symbol}`}
              >
                Swap
              </InternalLink>
            </li>
          ))
        )}
      </ul>
    </Content>
  );
}
export default Token;
