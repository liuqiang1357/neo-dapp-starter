'use client';

import { useAtomValue } from 'jotai';
import { ComponentProps, FC, useState } from 'react';
import {
  connectorDownloadUrls,
  ConnectorId,
  connectorNames,
  supportedConnectorIds,
} from '@/configs/chains';
import { accountAtom, chainIdAtom, connectorDatasAtom } from '@/lib/states/neo';
import { formatLongText } from '@/lib/utils/formatters';
import { connect, disconnect } from '@/lib/utils/neo/actions';
import { cn } from '@/lib/utils/shadcn';
import { Button } from '@/ui/shadcn/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../shadcn/dialog';
import { AccountIcon } from './account-icon';

export const Connect: FC<ComponentProps<'div'>> = ({ className, ...props }) => {
  const chainId = useAtomValue(chainIdAtom);

  const account = useAtomValue(accountAtom);

  const [open, setOpen] = useState(false);

  const connectorDatas = useAtomValue(connectorDatasAtom);

  const handleConnectClick = async (connectorId: ConnectorId) => {
    if (connectorDatas[connectorId].installed === false) {
      window.open(connectorDownloadUrls[connectorId], '_blank');
      return;
    }
    await connect({ connectorId, chainId });
    setOpen(false);
  };

  return (
    <div className={cn('group relative inline-flex', className)} {...props}>
      <Button
        className={cn('flex items-center', account != null && 'group-hover:opacity-0')}
        variant="outline"
        onClick={() => setOpen(true)}
      >
        {account != null ? (
          <>
            <AccountIcon account={account} />
            <div className="ml-2">{formatLongText(account, { headTailLength: 4 })}</div>
          </>
        ) : (
          'Connect wallet'
        )}
      </Button>
      {account != null && (
        <Button
          className="absolute inset-0 flex h-auto items-center opacity-0 group-hover:opacity-100"
          variant="destructive"
          onClick={() => disconnect()}
        >
          Disconnect
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-auto px-12 py-6">
          <DialogHeader>
            <DialogTitle>Connect Wallet</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            <div className="flex flex-col space-y-4">
              {supportedConnectorIds.map(connectorId => (
                <Button
                  key={connectorId}
                  size="lg"
                  disabled={connectorDatas[connectorId].installed == null}
                  onClick={() => handleConnectClick(connectorId)}
                >
                  Connect to {connectorNames[connectorId]}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
