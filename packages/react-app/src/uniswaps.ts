import { ChainId, Token, TokenAmount, Pair, TradeType, Route, Trade } from '@uniswap/sdk'
import ApolloClient, { ApolloLink } from "apollo-boost";
import { gql } from "apollo-boost";
import { ethers } from 'ethers';

const graphs = {
  1: new ApolloClient({ uri: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2'}),
  56: new ApolloClient({ uri: 'https://api.thegraph.com/subgraphs/name/bscnodes/pancakeswap'}), // https://thegraph.com/explorer/subgraph/bscnodes/pancakeswap
  100: new ApolloClient({ uri: 'https://api.thegraph.com/subgraphs/name/1hive/honeyswap-xdai'}),
  137: new ApolloClient({ uri: 'https://api.thegraph.com/subgraphs/name/sameepsi/quickswap'}),
}



export const TOKEN_PAIRS = gql`
  query($limit:Int){
    pairs(
      first: $limit,
      orderBy: volumeUSD, 
      orderDirection: desc, 
      where: {reserve0_gt: 1, reserve1_gt: 1 }
    ) {
        id
        token0 {
          id
          symbol
          name
          decimals
        }
        token1 {
          id
          symbol
          name
          decimals
        }
        reserve0
        reserve1
        volumeUSD
        totalSupply
      }
  }
`

const getPairs = (client: ApolloClient<unknown>, chainId: number) => {
  return client
    .query({
      query: TOKEN_PAIRS,
      variables: {
        limit: 100,
      },
    })
    .then(res => res.data.pairs)
    .then(pairs => pairs.map((pair: any) => {
      pair.chainId = chainId
      return pair
    }))
    .then(pairs => pairs.map(parseTokenPair))
    
}

const parseTokenPair = (pair: any) => {
  const token0 = new Token(pair.chainId, ethers.utils.getAddress(pair.token0.id), parseInt(pair.token0.decimals), pair.token0.symbol, pair.token0.name)
  const token1 = new Token(pair.chainId, ethers.utils.getAddress(pair.token1.id), parseInt(pair.token1.decimals), pair.token1.symbol, pair.token1.name)

  const token0_token1 = new Pair(new TokenAmount(token0, pair.reserve0.replace('.', '')), new TokenAmount(token1, pair.reserve1.replace('.', '')))
  return token0_token1
}

const test = async () => {
  // getPairs(graphs[1], 1)
  // getPairs(graphs[56], 56)
  // getPairs(graphs[100], 100)
  // getPairs(graphs[137], 137)

  const honeyPairs = await getPairs(graphs[100], 100)

  const token0 = new Token(100, '0xddafbb505ad214d7b80b1f830fccc89b60fb7a83', 6, 'USDC')
  const token1 = new Token(100, '0x4ecaba5870353805a9f068101a40e0f32ed605c6', 6, 'USDT')
  const bestPath = findBestPathExactIn(honeyPairs, token0, token1, '1000000')
  console.log(bestPath)

  console.log('bestPath:', bestPath[0].route.path.map((token: Token) => token.symbol))
}

export default test

// pars
// const honey_pairs = honey_pairs_json.data.pairs
//   .map(pair => {
//     const token0 = new Token(ChainId.MAINNET, pair.token0.id, parseInt(pair.token0.decimals), pair.token0.symbol, pair.token0.name)
//     const token1 = new Token(ChainId.MAINNET, pair.token1.id, parseInt(pair.token1.decimals), pair.token1.symbol, pair.token1.name)

//     const token0_token1 = new Pair(new TokenAmount(token0, pair.reserve0.replace('.', '')), new TokenAmount(token1, pair.reserve1.replace('.', '')))
//     return token0_token1
//   })

// const bestIn = Trade.bestTradeExactIn(pairs, new TokenAmount(pairs[0].token0, '100'), pairs[0].token1)
// console.log(bestIn)

const findBestPathExactIn = (pairs: Array<Pair>, token0: Token, token1: Token, amountIn: string) => {
  const bestIn = Trade.bestTradeExactIn(pairs, new TokenAmount(token0, amountIn), token1)
  return bestIn
}
// bestTradeExactOut

// const token0 = new Token(ChainId.MAINNET, '0xddafbb505ad214d7b80b1f830fccc89b60fb7a83', 6, 'USDC')
// const token1 = new Token(ChainId.MAINNET, '0x4ecaba5870353805a9f068101a40e0f32ed605c6', 6, 'USDT')
// findBestPathExactIn(honey_pairs, token0, token1, '1000000')
