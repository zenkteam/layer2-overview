import React from "react";
import { Content, IconImage, InternalLink } from ".";

function Home({ chainInfos, combined }) {
  return (
    <Content>
      <h1 id="title"><span role="img" aria-labelledby="title">🐰</span>Off L1</h1>
      <div>Swap between Uniswap clones across chains</div>
      {combined?.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Coin</th>
              {chainInfos.map((c) => {
                return (
                  <th key={c.name} style={{ padding: '5px 20px' }}>
                    <IconImage src={c.exchangeIcon} />
                    <br />
                    on {c.name}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {combined.map((coin) => (
              <tr key={coin.symbol}>
                <td>
                  <InternalLink to={`/token/${coin.symbol}`}>
                    {coin.symbol}
                  </InternalLink>
                </td>

                {chainInfos.map((_, i) => (
                  <td key={i} style={{ textAlign: 'center' }}>
                    { coin.data[i] ? '$' + (coin.data[i].derivedETH * chainInfos[i].unitPrice).toFixed(2) : 'N/A'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        "Loading..."
      )}
    </Content>
  );
}
export default Home;
