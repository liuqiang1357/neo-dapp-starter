import { Input } from 'antd';
import { FC, useState } from 'react';
import { useSnapshot } from 'valtio';
import { Button } from 'app/_shared/Button';
import { useNep17RawBalance, useTransferNep17 } from 'hooks/nep17';
import { web3State } from 'states/web3';
import { Networks } from './Networks';
import { Wallets } from './Wallets';

export const Home: FC = () => {
  const [contractHash, setContractHash] = useState('');
  const [to, setTo] = useState('');
  const [rawAmount, setRawAmount] = useState('');

  const { address } = useSnapshot(web3State);

  const { data: rawBalance } = useNep17RawBalance(
    address != null && contractHash !== '' ? { address, contractHash } : null,
  );

  const { mutateAsync: transfer, isLoading: sending } = useTransferNep17();

  const send = async () => {
    if (address != null && contractHash !== '' && to !== '' && rawAmount !== '') {
      await transfer({ address, contractHash, to, rawAmount });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between px-[40px] py-[20px]">
        <h2>Home Page</h2>
        <div className="flex">
          <Wallets />
          <Networks className="ml-[10px]" />
        </div>
      </div>
      <div className="flex w-[600px] flex-col space-y-[20px] px-[40px]">
        <div className="flex items-center">
          <div>Address:</div>
          <div className="ml-[10px]">{address}</div>
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
