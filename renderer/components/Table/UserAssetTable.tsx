import React, { useState, useEffect } from 'react'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import { styled } from '@mui/material'
import { shorterAddress } from '../../utils/format'
import { useChainContext } from '../../contexts/ChainContext/hooks'
import { getTokenFromContract } from '../../utils/getToken'
import { ethers } from 'ethers'
import { MyAssetsDto } from '../../types'

interface UserAssetTableProps {
  listData?: MyAssetsDto
}

export function UserAssetTable({ listData }: UserAssetTableProps) {
  const { chainId } = useChainContext()

  const formatAmount = (amount: string, decimals: number = 18) => {
    return ethers.formatUnits(amount, decimals)
  }

  return (
    <TableContainer
      component={Paper}
      sx={{ background: 'none', boxShadow: 'none', border: 'none' }}
    >
      <Table
        sx={{
          minWidth: 650,
          background: '#1E2128',
          borderRadius: '20px'
        }}
        aria-label='simple table'
      >
        <TableHead>
          <TableRow sx={{ th: { border: 0 } }}>
            <StyledTableCell>Asset</StyledTableCell>
            <StyledTableCell align='center'>Contract Address</StyledTableCell>
            <StyledTableCell align='center'>Amount</StyledTableCell>
            <StyledTableCell align='right'>Locked Amount</StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {listData && listData.assets.length > 0 ? (
            listData.assets.map((row, index) => (
              <TableRow
                key={index}
                sx={{ 'td, th': { border: 0 } }}
              >
                <StyledTableCell
                  component='th'
                  scope='row'
                >
                  {getTokenFromContract(row.asset, chainId)?.symbol}
                </StyledTableCell>
                <StyledTableCell align='center'>
                  {shorterAddress(
                    getTokenFromContract(row.asset, chainId)?.address
                  )}
                </StyledTableCell>
                <StyledTableCell align='center'>
                  {formatAmount(
                    row.amount,
                    getTokenFromContract(row.asset, chainId)?.decimals
                  )}
                </StyledTableCell>
                <StyledTableCell align='right'>
                  {row.lockedAmount}
                </StyledTableCell>
              </TableRow>
            ))
          ) : (
            <TableRow sx={{ 'td, th': { border: 0 } }}>
              <StyledTableCell
                component='th'
                scope='row'
                colSpan={4}
                align='center'
              >
                No assets found.
              </StyledTableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  color: '#F3F4F6'
}))
