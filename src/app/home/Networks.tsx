import { App, Popover } from 'antd';
import { ComponentProps, FC, useEffect } from 'react';
import { useSnapshot } from 'valtio';
import { Button } from 'app/_shared/Button';
import { switchNetwork, web3State } from 'states/web3';
import { NETWORK_CONFIGS, SUPPORTED_NETWORK_IDS } from 'utils/configs';
import { tm } from 'utils/tailwind';

export const Networks: FC<ComponentProps<'div'>> = ({ className, ...rest }) => {
  const { networkId, walletNetworkId } = useSnapshot(web3State);

  const { message } = App.useApp();

  useEffect(() => {
    if (networkId !== walletNetworkId && walletNetworkId != null) {
      return message.info(
        <div className="inline-flex">
          <div>The wallet is not connected to {NETWORK_CONFIGS[networkId].name}.</div>
          <Button className="ml-[10px] underline" onClick={() => switchNetwork(networkId)}>
            Switch to {NETWORK_CONFIGS[networkId].name}
          </Button>
        </div>,
        100_000_000,
      );
    }
  }, [networkId, message, walletNetworkId]);

  return (
    <div className={tm('inline-block', className)} {...rest}>
      <Popover
        content={
          <div className="flex min-w-[180px] flex-col space-y-[10px] p-[20px]">
            {SUPPORTED_NETWORK_IDS.map(networkId => (
              <Button
                key={networkId}
                className="justify-start"
                type="default"
                onClick={() => switchNetwork(networkId)}
              >
                {NETWORK_CONFIGS[networkId].name}
              </Button>
            ))}
          </div>
        }
      >
        <Button type="default">{NETWORK_CONFIGS[networkId].name}</Button>
      </Popover>
    </div>
  );
};
