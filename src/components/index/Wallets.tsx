import { Button, Popover } from 'antd';
import { ComponentProps, CSSProperties, FC, useEffect } from 'react';
import { twMerge } from 'tailwind-merge';
import { useSelector, useStore } from 'hooks/redux';
import { selectWalletsPopoverOpen, setWalletsPopoverOpen } from 'store/slices/ui';
import {
  connectWallet,
  disconnectWallet,
  initWallets,
  selectActiveWalletState,
  selectWalletState,
  selectWalletStates,
} from 'store/slices/wallets';
import { WALLET_INFOS } from 'utils/configs';
import { WalletName } from 'utils/enums';
import { formatLongText } from 'utils/formatters';

export const Wallets: FC<ComponentProps<'div'>> = ({ className, ...props }) => {
  const walletsPopoverOpen = useSelector(selectWalletsPopoverOpen);

  const walletState = useSelector(selectActiveWalletState);

  const walletStates = useSelector(selectWalletStates);

  const { dispatch, getState } = useStore();

  const connect = async (walletName: WalletName) => {
    const walletState = selectWalletState(getState(), { walletName });
    if (!walletState) {
      return;
    }
    if (walletState.installed === false) {
      window.open(WALLET_INFOS[walletName].downloadUrl);
      return;
    }
    await dispatch(connectWallet(walletName)).unwrap();
    dispatch(setWalletsPopoverOpen(false));
  };

  const disconnect = async () => {
    if (!walletState) {
      return;
    }
    await dispatch(disconnectWallet(walletState.name)).unwrap();
  };

  useEffect(() => {
    (async () => {
      await dispatch(initWallets()).unwrap();
    })();
  }, [dispatch]);

  return (
    <div className={twMerge('inline-block', className)} {...props}>
      {walletState ? (
        <div className="group relative">
          <Button
            className="flex items-center group-hover:opacity-0"
            type="primary"
            ghost
            onClick={disconnect}
          >
            <img className="h-[16px] w-[16px]" src={WALLET_INFOS[walletState.name].image} />
            <div className="ml-[10px]">
              {formatLongText(walletState.address, { headTailLength: 5 })}
            </div>
          </Button>
          <Button
            className="absolute inset-0 h-auto opacity-0 group-hover:opacity-100"
            type="primary"
            danger
            onClick={disconnect}
          >
            Disconnect
          </Button>
        </div>
      ) : (
        <Popover
          open={walletsPopoverOpen}
          onOpenChange={open => dispatch(setWalletsPopoverOpen(open))}
          overlayStyle={{ '--popover-border-radius': '10px' } as CSSProperties}
          trigger="click"
          content={
            <div className="flex min-w-[180px] flex-col space-y-[10px] p-[20px]">
              {Object.values(WALLET_INFOS)
                .filter(info => info.disabled !== true)
                .map(info => (
                  <Button
                    key={info.name}
                    className="flex items-center justify-start"
                    type="primary"
                    ghost
                    disabled={walletStates[info.name] == null}
                    onClick={() => connect(info.name)}
                  >
                    <img className="h-[16px] w-[16px]" src={info.image} />
                    <div className="ml-[10px]">{info.name}</div>
                  </Button>
                ))}
            </div>
          }
        >
          <Button type="primary" ghost>
            Connect Wallet
          </Button>
        </Popover>
      )}
    </div>
  );
};
