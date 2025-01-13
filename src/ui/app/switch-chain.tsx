'use client';

import { useAtomValue } from 'jotai';
import { ComponentProps, FC } from 'react';
import { chainNames, supportedChainIds } from '@/configs/chains';
import { chainIdAtom, connectorChainIdAtom } from '@/lib/states/neo';
import { switchChain } from '@/lib/utils/neo/actions';
import { cn } from '@/lib/utils/shadcn';
import { Button } from '@/ui/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/shadcn/dropdown-menu';

export const SwitchChain: FC<ComponentProps<'div'>> = ({ className, ...props }) => {
  const chainId = useAtomValue(chainIdAtom);

  const connectorChainId = useAtomValue(connectorChainIdAtom);

  return (
    <div className={cn('inline-block', className)} {...props}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {connectorChainId != null && connectorChainId !== chainId ? (
            <Button variant="destructive">Wrong network</Button>
          ) : (
            <Button variant="outline">{chainNames[chainId]}</Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {supportedChainIds.map(chainId => (
            <DropdownMenuItem key={chainId} onClick={() => switchChain({ chainId })}>
              {chainNames[chainId]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
