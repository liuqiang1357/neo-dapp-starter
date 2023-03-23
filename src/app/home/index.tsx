import { FC } from 'react';
import { Wallets } from './Wallets';

export const Home: FC = () => {
  return (
    <div className="flex items-center justify-between px-[40px] py-[20px]">
      <h2>Home</h2>
      <Wallets />
    </div>
  );
};
