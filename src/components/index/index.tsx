import { FC } from 'react';
import { Wallets } from './Wallets';

export const Index: FC = () => {
  return (
    <div className="flex items-center justify-between px-[40px] py-[20px]">
      <h2>Index Page</h2>
      <Wallets />
    </div>
  );
};
