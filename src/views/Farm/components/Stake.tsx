import BigNumber from 'bignumber.js'
import React, { useCallback, useState } from 'react'
import styled from 'styled-components'
import { useWallet } from 'use-wallet'
import { Contract } from 'web3-eth-contract'
import Button from '../../../components/Button/BlackButton'
import Card from '../../../components/Card/TransCard'
import CardContent from '../../../components/CardContent'
import IconButton from '../../../components/IconButton'
import { AddIcon } from '../../../components/icons'
import Label from '../../../components/Label'
import Value from '../../../components/Value'
import useAllowance from '../../../hooks/useAllowance'
import useApprove from '../../../hooks/useApprove'
import useModal from '../../../hooks/useModal'
import useStake from '../../../hooks/useStake'
import useStakedBalance from '../../../hooks/useStakedBalance'
import useTokenBalance from '../../../hooks/useTokenBalance'
import useUnstake from '../../../hooks/useUnstake'
import { getBalanceNumber } from '../../../utils/formatBalance'
import DepositModal from './DepositModal'
import DepositModalWithRef from './DepositModalWithRef'
import WithdrawModal from './WithdrawModal'
import CardIcon from './CardIcon'
import HarvestIcon from '../../../assets/img/harvest-icon.png'

import { getCookie } from '../../../utils/cookie'

interface StakeProps {
  lpContract: Contract | any,
  pid: number,
  tokenName: string,
  isWBNB: boolean,
}

const Stake: React.FC<StakeProps> = ({ lpContract, pid, tokenName, isWBNB }) => {
  const [requestedApproval, setRequestedApproval] = useState(false)

  const { account, balance } = useWallet();
  const allowance = useAllowance(lpContract, pid)
  const { onApprove } = useApprove(lpContract, pid)

  const tokenBalance = useTokenBalance(lpContract.options.address)

  const stakedBalance = useStakedBalance(pid)

  const { onStake, onStakeWithRef } = useStake(pid)
  const { onUnstake } = useUnstake(pid)

  const [onPresentDepositWithRef] = useModal(
    <DepositModalWithRef
      max={isWBNB ? new BigNumber(balance) : tokenBalance}
      onConfirm={onStakeWithRef}
      tokenName={tokenName}
    />,
  )

  const [onPresentDeposit] = useModal(
    <DepositModal
      max={isWBNB ? new BigNumber(balance) : tokenBalance}
      onConfirm={onStake}
      tokenName={tokenName}
    />,
  )

  const [onPresentWithdraw] = useModal(
    <WithdrawModal
      max={stakedBalance}
      onConfirm={onUnstake}
      tokenName={tokenName}
    />,
  )

  function GetStakeType() {
    const c = getCookie('invite_id')
    if (c.toLocaleLowerCase() === account.toLocaleLowerCase()) {
      let cArray = document.cookie.split("; ");
      for (let i in cArray)
        document.cookie = /^[^=]+/.exec(cArray[i])[0] + "=; Max-Age=0";
    }
    if (c && c.toLocaleLowerCase() !== account.toLocaleLowerCase()) {
      return (
        <IconButton onClick={onPresentDepositWithRef}>
          <AddIcon />
        </IconButton>
      )
    } else {
      return (
        <IconButton onClick={onPresentDeposit}>
          <AddIcon />
        </IconButton>
      )
    }
  }

  const handleApprove = useCallback(async () => {
    try {
      setRequestedApproval(true)
      const txHash = await onApprove()
      // user rejected tx or didn't go thru
      console.warn('approve', txHash)
      if (!txHash) {
        console.log('no approve')
        setRequestedApproval(false)
      }
    } catch (e) {
      console.log(e)
    }
  }, [onApprove, setRequestedApproval])

  return (
    <Card>
      <CardContent>
        <StyledCardContentInner>
          <StyledCardHeader>
            <CardIcon>
              <StyledImageIcon src={HarvestIcon} alt="icon" />
            </CardIcon>
            <Value value={getBalanceNumber(stakedBalance)} />
            <Label text={`${tokenName} Tokens Staked`} />
          </StyledCardHeader>
          <StyledCardActions>
            {!isWBNB && !allowance.toNumber() ? (
              <Button
                disabled={requestedApproval}
                onClick={handleApprove}
                text={`Approve ${tokenName}`}
              />
            ) : (
                <>
                  <Button
                    disabled={stakedBalance.eq(new BigNumber(0))}
                    text="Unstake"
                    onClick={onPresentWithdraw}
                  />
                  <StyledActionSpacer />
                  <GetStakeType />
                </>
              )}
          </StyledCardActions>
        </StyledCardContentInner>
      </CardContent>
    </Card>
  )
}

const StyledCardHeader = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
`
const StyledCardActions = styled.div`
  display: flex;
  justify-content: center;
  margin-top: ${(props) => props.theme.spacing[6]}px;
  width: 100%;
`

const StyledActionSpacer = styled.div`
  height: ${(props) => props.theme.spacing[4]}px;
  width: ${(props) => props.theme.spacing[4]}px;
`

const StyledCardContentInner = styled.div`
  align-items: center;
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: space-between;
`

const StyledImageIcon = styled.img`
  display: block;
  width: 100%;
  height: 100%;
`

export default Stake
