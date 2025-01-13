import { zipObject } from 'es-toolkit';
import { atom } from 'jotai';
import { $enum } from 'ts-enum-util';
import { z } from 'zod';
import { ChainId, ConnectorId, supportedChainIds, supportedConnectorIds } from '@/configs/chains';
import { atomWithStorage, store } from '../utils/jotai';
import { connect, disconnect } from '../utils/neo/actions';
import { connectors } from '../utils/neo/connectors';
import { ConnectorData as ConnectorConnectorData } from '../utils/neo/connectors/types';

export const lastConnectedConnectorIdAtom = atomWithStorage(
  'lastConnectedConnectorId',
  z.nativeEnum(ConnectorId).nullable(),
  null,
);

export type ConnectorData = ConnectorConnectorData & {
  installed: boolean | null;
};

export const connectorDatasAtom = atom<Record<ConnectorId, ConnectorData>>(
  zipObject(
    $enum(ConnectorId).getValues(),
    $enum(ConnectorId).map(() => ({ installed: null, account: null, chainId: null })),
  ),
);

connectorDatasAtom.onMount = setAtom => {
  const disposers: (() => void)[] = [];

  for (const connectorId of supportedConnectorIds) {
    (async () => {
      const connector = connectors[connectorId];

      await connector.init();
      disposers.push(() => connector.destroy());

      const installed = await connector.isIntalled();
      setAtom(connectorDatas => ({
        ...connectorDatas,
        [connectorId]: { ...connectorDatas[connectorId], installed },
      }));

      if (!installed) {
        return;
      }

      const listener = (data: ConnectorConnectorData) => {
        setAtom(connectorDatas => ({
          ...connectorDatas,
          [connectorId]: { ...connectorDatas[connectorId], ...data },
        }));
      };
      connector.on('change', listener);
      disposers.push(() => connector.off('change', listener));

      listener(await connector.getData());

      if (store.get(lastConnectedConnectorIdAtom) === connectorId) {
        if (await connector.isAuthorized()) {
          connect({ connectorId }).catch(disconnect);
        }
      }
    })();
  }

  return () => disposers.forEach(disposer => disposer());
};

export const connectedConnectorDataAtom = atom(get => {
  const connectorId = get(lastConnectedConnectorIdAtom);
  if (connectorId == null) {
    return null;
  }
  const connectorDatas = get(connectorDatasAtom);
  const connectorData = connectorDatas[connectorId];
  if (connectorData.account == null) {
    return null;
  }
  return connectorData;
});

export const connectorChainIdAtom = atom(get => get(connectedConnectorDataAtom)?.chainId);

export const connectorAccountAtom = atom(get => get(connectedConnectorDataAtom)?.account);

export const storageChainIdAtom = atomWithStorage(
  'chainId',
  z.nativeEnum(ChainId).nullable(),
  null,
);

storageChainIdAtom.onMount = setAtom => {
  return store.sub(connectorChainIdAtom, () => {
    const connectorChainId = store.get(connectorChainIdAtom);
    const lastConnectorChainId = store.get(connectorChainIdAtom);
    if (
      connectorChainId != null &&
      supportedChainIds.includes(connectorChainId) &&
      connectorChainId !== lastConnectorChainId
    ) {
      setAtom(connectorChainId);
    }
  });
};

export const chainIdAtom = atom(get => {
  const connectorChainId = get(connectorChainIdAtom);
  if (connectorChainId != null && supportedChainIds.includes(connectorChainId)) {
    return connectorChainId;
  }
  const storageChainId = get(storageChainIdAtom);
  if (storageChainId != null && supportedChainIds.includes(storageChainId)) {
    return storageChainId;
  }
  return supportedChainIds[0];
});

export const accountAtom = connectorAccountAtom;
