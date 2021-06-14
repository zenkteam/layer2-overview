// const util = require('util')
import { inspect } from 'util'

export enum ChainKey {
  ETH = 'eth',
  POL = 'pol',
  BSC = 'bsc',
  DAI = 'dai',
}

export interface Token {
  symbol: string
}


export interface BaseEstimate {
  fromAmount: number
  toAmount: number
  fees: {
    included: boolean
    percentage: number | null
    token: Token
    amount: number
  }
}

export interface DepositEstimate extends BaseEstimate { }
export interface SwapEstimate extends BaseEstimate {
  path: Array<string>
}
export interface CrossEstimate extends BaseEstimate { }
export interface WithdrawEstimate extends BaseEstimate { }

export type Estimate = SwapEstimate | DepositEstimate | CrossEstimate | WithdrawEstimate


export interface Execution {

}

export interface Step {
  action: Action
  estimate?: Estimate
  execution?: Execution
}


interface ActionBase {
  type: string
  chainKey: ChainKey
}

export interface DepositAction extends ActionBase {
  type: 'deposit'
  amount: number
  token: Token
}

export interface WithdrawAction extends ActionBase {
  type: 'withdraw'
  amount: number
  token: Token
}

export interface SwapAction extends ActionBase {
  type: 'swap'
  fromToken: Token
  toToken: Token

  fromAmount: number
  toAmount: number
}

export interface CrossAction extends ActionBase {
  type: 'cross'
  toChainKey: ChainKey
  amount: number
  token: Token
}

export type Action = DepositAction | WithdrawAction | SwapAction | CrossAction

const findTransfers = (deposit: DepositAction, withdraw: WithdrawAction): Array<Array<Action>> => {
  // same chain
  if (deposit.chainKey === withdraw.chainKey) {

    // same token
    if (deposit.token === withdraw.token) {
      return []
    }

    // differnt tokens
    return [[
      {
        type: 'swap',
        chainKey: deposit.chainKey,
        fromToken: deposit.token,
        toToken: withdraw.token,
        fromAmount: Infinity,
        toAmount: Infinity,
      } as SwapAction
    ]]
  }

  // different chain
  const transferableTokens: Array<Token> = [
    { symbol: 'USDC' },
    { symbol: 'USDT' },
    { symbol: 'DAI' },
  ]

  const routes: Array<Array<Action>> = []

  for (const transferableToken of transferableTokens) {
    const route: Array<Action> = []
    routes.push(route)

    // swap deposit
    if (deposit.token.symbol !== transferableToken.symbol) {
      route.push({
        type: 'swap',
        chainKey: deposit.chainKey,
        fromToken: deposit.token,
        toToken: transferableToken,
        fromAmount: Infinity,
        toAmount: Infinity,
      } as SwapAction)
    }

    // cross
    route.push({
      type: 'cross',
      chainKey: deposit.chainKey,
      toChainKey: withdraw.chainKey,
      amount: Infinity,
      token: transferableToken,
    } as CrossAction)

    // swap for withdraw
    if (withdraw.token.symbol !== transferableToken.symbol) {
      route.push({
        type: 'swap',
        chainKey: withdraw.chainKey,
        fromToken: transferableToken,
        toToken: withdraw.token,
        fromAmount: Infinity,
        toAmount: Infinity,
      } as SwapAction)
    }
  }

  return routes
}

const estimate = (steps: Array<Step>) => {
  if (isFinite((steps[0].action as DepositAction).amount)) {
    return estimateForwards(steps)
  } else {
    return estimateBackwards(steps)
  }
}

const estimateForwards = (steps: Array<Step>) => {
  // TODO: balance per chain
  const stateChannel: { 'balances': { [key: string]: number } } = {
    balances: {}
  }

  for (const step of steps) {
    switch (step.action.type) {
      // deposit: estimate gas fees
      case 'deposit': {
        const deposit = step.action as DepositAction

        // TODO: get real fees per chain
        const depositEstimate: DepositEstimate = {
          fromAmount: deposit.amount,
          toAmount: deposit.amount,
          fees: {
            included: false,
            percentage: null,
            token: {
              symbol: 'BNB'
            },
            amount: 0.000261,
          },
        }

        stateChannel.balances[deposit.token.symbol] = (stateChannel.balances[deposit.token.symbol] || 0) + depositEstimate.toAmount
        step.estimate = depositEstimate
        break
      }

      // swap: estimate in/out + fees
      case 'swap': {
        const swap = step.action as SwapAction
        const fromAmount = Math.min(swap.fromAmount, stateChannel.balances[swap.fromToken.symbol])
        // TODO: handle finite toAmount
        // TODO: findBestRoute

        const swapEstimate: SwapEstimate = {
          fromAmount,
          toAmount: fromAmount * 0.997,
          fees: {
            included: true,
            percentage: 0.3,
            token: swap.fromToken,
            amount: fromAmount * 0.003,
          },
          path: [swap.fromToken.symbol, swap.toToken.symbol],
        }

        stateChannel.balances[swap.fromToken.symbol] -= swapEstimate.fromAmount
        stateChannel.balances[swap.toToken.symbol] = (stateChannel.balances[swap.toToken.symbol] || 0) + swapEstimate.toAmount
        step.estimate = swapEstimate
        break
      }

      // cross: estimate in/out + fees
      case 'cross': {
        const cross = step.action as CrossAction
        const fromAmount = Math.min(cross.amount, stateChannel.balances[cross.token.symbol])
        // TODO: get connext estimates
        const crossEstimate: CrossEstimate = {
          fromAmount,
          toAmount: fromAmount * 0.995,
          fees: {
            included: true,
            percentage: 0.5,
            token: cross.token,
            amount: fromAmount * 0.005,
          },
        }

        stateChannel.balances[cross.token.symbol] -= crossEstimate.fromAmount
        stateChannel.balances[cross.token.symbol] += crossEstimate.toAmount
        step.estimate = crossEstimate
        break
      }

      // withdraw: estimate result
      case 'withdraw': {
        const withdraw = step.action as WithdrawAction
        const fromAmount = Math.min(withdraw.amount, stateChannel.balances[withdraw.token.symbol])

        const withdrawEstimate: WithdrawEstimate = {
          fromAmount,
          toAmount: fromAmount,
          fees: {
            included: true,
            percentage: 0,
            token: withdraw.token,
            amount: 0,
          },
        }

        stateChannel.balances[withdraw.token.symbol] -= withdrawEstimate.fromAmount
        step.estimate = withdrawEstimate
        break
      }

      default: {
        console.warn('should never reach here')
      }
    }
  }

  return steps
}


const estimateBackwards = (steps: Array<Step>) => {
  // TODO: balance per chain
  const stateChannel: { 'balances': { [key: string]: number } } = {
    balances: {}
  }

  for (const step of steps.reverse()) {
    switch (step.action.type) {
      // withdraw: estimate what has to go in
      case 'withdraw': {
        const withdraw = step.action as WithdrawAction

        const withdrawEstimate: WithdrawEstimate = {
          fromAmount: withdraw.amount,
          toAmount: withdraw.amount,
          fees: {
            included: true,
            percentage: 0,
            token: withdraw.token,
            amount: 0,
          },
        }

        stateChannel.balances[withdraw.token.symbol] = (stateChannel.balances[withdraw.token.symbol] || 0) + withdraw.amount
        step.estimate = withdrawEstimate
        break
      }

      // swap: estimate in/out + fees
      case 'swap': {
        const swap = step.action as SwapAction
        if (isFinite(swap.toAmount)) console.warn('swap.toAmount not supported')
        if (isFinite(swap.fromAmount)) console.warn('swap.fromAmount not supported')
        const toAmount = stateChannel.balances[swap.toToken.symbol]
        const fromAmount = toAmount / 0.997
        // TODO: findBestRoute

        const swapEstimate: SwapEstimate = {
          fromAmount,
          toAmount,
          fees: {
            included: true,
            percentage: 0.3,
            token: swap.fromToken,
            amount: fromAmount * 0.003,
          },
          path: [swap.fromToken.symbol, swap.toToken.symbol],
        }

        stateChannel.balances[swap.fromToken.symbol] = (stateChannel.balances[swap.fromToken.symbol] || 0) + swapEstimate.fromAmount
        stateChannel.balances[swap.toToken.symbol] = (stateChannel.balances[swap.toToken.symbol] || 0) - swapEstimate.toAmount
        step.estimate = swapEstimate
        break
      }

      // cross: estimate in/out + fees
      case 'cross': {
        const cross = step.action as CrossAction
        if (isFinite(cross.amount)) console.warn('cross.amount not supported')
        const toAmount = stateChannel.balances[cross.token.symbol]
        const fromAmount = toAmount / 0.995

        // TODO: get connext estimates
        const crossEstimate: CrossEstimate = {
          fromAmount,
          toAmount,
          fees: {
            included: true,
            percentage: 0.5,
            token: cross.token,
            amount: fromAmount * 0.005,
          },
        }

        stateChannel.balances[cross.token.symbol] -= crossEstimate.toAmount
        stateChannel.balances[cross.token.symbol] += crossEstimate.fromAmount
        step.estimate = crossEstimate
        break
      }

      // deposit: estimate gas fees
      case 'deposit': {
        const deposit = step.action as DepositAction
        if (isFinite(deposit.amount)) console.warn('deposit.amount not supported')
        const toAmount = stateChannel.balances[deposit.token.symbol]

        // TODO: get real fees per chain
        const depositEstimate: DepositEstimate = {
          fromAmount: toAmount,
          toAmount: toAmount,
          fees: {
            included: false,
            percentage: null,
            token: {
              symbol: 'BNB'
            },
            amount: 0.000261,
          },
        }

        stateChannel.balances[deposit.token.symbol] = (stateChannel.balances[deposit.token.symbol] || 0) - depositEstimate.toAmount
        step.estimate = depositEstimate
        break
      }

      default: {
        console.warn('should never reach here')
      }
    }
  }

  return steps.reverse()
}


export const testForwards = () => {
  const defaultDeposit: DepositAction = {
    type: 'deposit',
    chainKey: ChainKey.BSC,
    amount: 10,
    token: {
      symbol: 'USDC',
    },
  }
  
  const defaultWithdraw: WithdrawAction = {
    type: 'withdraw',
    chainKey: ChainKey.DAI,
    amount: Infinity,
    token: {
      symbol: 'ETH',
    },
  }

  const routes = findTransfers(defaultDeposit, defaultWithdraw)
  // console.log(routes)

  // to steps
  const steps: Array<Array<Step>> = routes.map(route => {
    return [
      { action: defaultDeposit },
      ...route.map(action => {
        return {
          action,
        } as Step
      }),
      { action: defaultWithdraw },
    ]
  })
  // console.log(steps)

  // estimate
  const estimatedSteps = steps.map(estimate)
  console.log('estimatedSteps', inspect(estimatedSteps, { depth: 4 }))
}

export const testBackwards = () => {
  const defaultDeposit: DepositAction = {
    type: 'deposit',
    chainKey: ChainKey.BSC,
    amount: Infinity,
    token: {
      symbol: 'BNB',
    },
  }
  
  const defaultWithdraw: WithdrawAction = {
    type: 'withdraw',
    chainKey: ChainKey.DAI,
    amount: 10,
    token: {
      symbol: 'DAI',
    },
  }

  const routes = findTransfers(defaultDeposit, defaultWithdraw)
  // console.log(routes)

  // to steps
  const steps: Array<Array<Step>> = routes.map(route => {
    return [
      { action: defaultDeposit },
      ...route.map(action => {
        return {
          action,
        } as Step
      }),
      { action: defaultWithdraw },
    ]
  })
  // console.log('steps', inspect(steps, { depth: 4 }))

  // estimate
  const estimatedSteps = steps.map(estimate)
  console.log('estimatedSteps', inspect(estimatedSteps, { depth: 4 }))
}

testForwards()