import { Popover } from 'antd';
import { ComponentProps, FC } from 'react';
import { useSnapshot } from 'valtio';
import { Button } from 'app/_shared/Button';
import { uiState } from 'states/ui';
import { connect, disconnect, web3State } from 'states/web3';
import { SUPPORTED_WALLET_IDS, WALLET_CONFIGS } from 'utils/configs';
import { formatLongText } from 'utils/formatters';
import { WalletId } from 'utils/models';
import { tm } from 'utils/tailwind';
import disconnectImage from './_images/disconnect.svg';

export const Wallets: FC<ComponentProps<'div'>> = ({ className, ...rest }) => {
  const { connectionDatas, walletId, address } = useSnapshot(web3State);

  const { walletsPopoverOpen } = useSnapshot(uiState);

  const handleConnectClick = async (walletId: WalletId) => {
    if (connectionDatas[walletId].ready === false) {
      window.open(WALLET_CONFIGS[walletId].downloadUrl);
      return;
    }
    await connect(walletId);
    uiState.walletsPopoverOpen = false;
  };

  return (
    <div className={tm('inline-block', className)} {...rest}>
      {walletId != null ? (
        <div className="group relative">
          <Button className="group-hover:opacity-0" type="primary">
            <img className="h-[16px] w-[16px]" src={WALLET_CONFIGS[walletId].icon} />
            <div className="ml-[10px]">{formatLongText(address, { headTailLength: 5 })}</div>
          </Button>
          <Button
            className="absolute inset-0 h-auto opacity-0 group-hover:opacity-100"
            type="primary"
            danger
            onClick={disconnect}
          >
            <img src={disconnectImage} />
            <div className="ml-[10px]">Disconnect</div>
          </Button>
        </div>
      ) : (
        <Popover
          open={walletsPopoverOpen}
          onOpenChange={open => (uiState.walletsPopoverOpen = open)}
          trigger="click"
          content={
            <div className="flex min-w-[180px] flex-col space-y-[10px] p-[20px]">
              {SUPPORTED_WALLET_IDS.map(walletId => (
                <Button
                  key={WALLET_CONFIGS[walletId].name}
                  className="justify-start"
                  type="default"
                  disabled={connectionDatas[walletId].ready == null}
                  onClick={() => handleConnectClick(walletId)}
                >
                  <img className="h-[16px] w-[16px]" src={WALLET_CONFIGS[walletId].icon} />
                  <div className="ml-[10px]">{WALLET_CONFIGS[walletId].name}</div>
                </Button>
              ))}
            </div>
          }
        >
          <Button type="default">Connect Wallet</Button>
        </Popover>
      )}
    </div>
  );
};
