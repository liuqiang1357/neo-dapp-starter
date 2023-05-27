import { skipToken } from '@reduxjs/toolkit/dist/query';
import { Input } from 'antd';
import { FC, useState } from 'react';
import { Button } from 'app/_shared/Button';
import { useNep17TransferMutation } from 'store/apis/invoke';
import { useGetNep17RawBalanceQuery } from 'store/apis/invokeRead';
import { selectActiveWalletState } from 'store/slices/wallets';
import { useSelector } from 'utils/hooks/redux';
import { Wallets } from './Wallets';

export const Home: FC = () => {
  const [contractHash, setContractHash] = useState('');
  const [to, setTo] = useState('');
  const [rawAmount, setRawAmount] = useState('');

  const walletState = useSelector(selectActiveWalletState);

  const { currentData: rawBalance } = useGetNep17RawBalanceQuery(
    contractHash !== '' && walletState ? { contractHash, address: walletState.address } : skipToken,
  );

  const [nep17TransferMutation, { isLoading: sending }] = useNep17TransferMutation();

  const send = async () => {
    if (contractHash !== '' && walletState && to !== '' && rawAmount !== '')
      await nep17TransferMutation({
        contractHash,
        from: walletState.address,
        to: to,
        rawAmount,
      }).unwrap();
  };

  return (
    <div>
      <div className="flex items-center justify-between px-[40px] py-[20px]">
        <h2>Home Page</h2>
        <Wallets />
      </div>
      <div className="flex w-[600px] flex-col space-y-[20px] px-[40px]">
        <div className="flex items-center">
          <div>Address:</div>
          <div className="ml-[10px]">{walletState?.address}</div>
        </div>
        <Input
          placeholder="NEP17 contract hash"
          value={contractHash}
          onChange={event => setContractHash(event.target.value)}
        />
        <div className="flex items-center">
          <div>Raw balance:</div>
          <div className="ml-[10px]">{rawBalance}</div>
        </div>
        <Input placeholder="To" value={to} onChange={event => setTo(event.target.value)} />
        <Input
          placeholder="Raw amount"
          value={rawAmount}
          onChange={event => setRawAmount(event.target.value)}
        />
        <Button className="self-start" type="primary" loading={sending} onClick={send}>
          Send
        </Button>
      </div>
    </div>
  );
};
