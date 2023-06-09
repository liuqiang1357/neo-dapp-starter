import { Popover } from 'antd';
import { ComponentProps, FC, useEffect } from 'react';
import { Button } from 'app/_shared/Button';
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
import { tm } from 'utils/tailwind';
import disconnectImage from './_images/disconnect.svg';

export const Wallets: FC<ComponentProps<'div'>> = ({ className, ...rest }) => {
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
    await dispatch(disconnectWallet()).unwrap();
  };

  useEffect(() => {
    (async () => {
      await dispatch(initWallets()).unwrap();
    })();
  }, [dispatch]);

  return (
    <div className={tm('inline-block', className)} {...rest}>
      {walletState ? (
        <div className="group relative">
          <Button className="group-hover:opacity-0" type="primary">
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
            <img src={disconnectImage} />
            <div className="ml-[10px]">Disconnect</div>
          </Button>
        </div>
      ) : (
        <Popover
          open={walletsPopoverOpen}
          onOpenChange={open => dispatch(setWalletsPopoverOpen(open))}
          trigger="click"
          content={
            <div className="flex min-w-[180px] flex-col space-y-[10px] p-[20px]">
              {Object.values(WALLET_INFOS)
                .filter(info => info.disabled !== true)
                .map(info => (
                  <Button
                    key={info.name}
                    className="justify-start"
                    type="default"
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
          <Button type="default">Connect Wallet</Button>
        </Popover>
      )}
    </div>
  );
};
