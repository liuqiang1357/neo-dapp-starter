import { BaseError, BaseErrorOptions } from './base';

export class ConnectorNotInstalledError extends BaseError {
  name = 'ConnectorNotInstalledError';

  constructor(message = 'Wallet not installed.', options: BaseErrorOptions = {}) {
    super(message, { ...options, needFix: options.needFix ?? false });
  }
}

export class ConnectorNotConnectedError extends BaseError {
  name = 'ConnectorNotConnectedError';

  constructor(message = 'Wallet not connected.', options: BaseErrorOptions = {}) {
    super(message, { ...options, needFix: options.needFix ?? false });
  }
}

export class ConnectorCommunicationError extends BaseError {
  name = 'ConnectorCommunicationError';

  constructor(message = 'Communicate failed with wallet.', options: BaseErrorOptions = {}) {
    super(message, options);
  }
}

export class ConnectorVersionIncompatibleError extends BaseError {
  name = 'ConnectorVersionIncompatibleError';

  constructor(
    message = 'The version of the wallet is not compatible with this app, please upgrade to the latest version.',
    options: BaseErrorOptions = {},
  ) {
    super(message, { ...options, needFix: options.needFix ?? false });
  }
}

export class ConnectorChainMismatchError extends BaseError {
  name = 'ConnectorChainMismatchError';

  constructor(
    message = 'The current network of the wallet does not match the requesting one, please switch in the wallet.',
    options: BaseErrorOptions = {},
  ) {
    super(message, { ...options, needFix: options.needFix ?? false });
  }
}

export class ConnectorAccountNotFoundError extends BaseError {
  name = 'ConnectorAccountNotFoundError';

  constructor(message = 'Wallet does not have an account.', options: BaseErrorOptions = {}) {
    super(message, { ...options, needFix: options.needFix ?? false });
  }
}

export class ConnectorAccountMismatchError extends BaseError {
  name = 'ConnectorAccountMismatchError';

  constructor(
    message = 'The current account of the wallet does not match the requesting one, please switch in the wallet.',
    options: BaseErrorOptions = {},
  ) {
    super(message, { ...options, needFix: options.needFix ?? false });
  }
}

export class InvalidParamsError extends BaseError {
  name = 'InvalidParamsError';

  constructor(message = 'Invalid params.', options: BaseErrorOptions = {}) {
    super(message, options);
  }
}

export class InsufficientFundsError extends BaseError {
  name = 'InsufficientFundsError';

  constructor(message = 'Insufficient funds.', options: BaseErrorOptions = {}) {
    super(message, { ...options, needFix: options.needFix ?? false });
  }
}

export class InternalRpcError extends BaseError {
  name = 'InternalRpcError';

  constructor(message = 'Internal RPC error.', options: BaseErrorOptions = {}) {
    super(message, options);
  }
}

export class UserRejectedRequestError extends BaseError {
  name = 'UserRejectedRequestError';

  constructor(message = 'User rejected request.', options: BaseErrorOptions = {}) {
    super(message, { ...options, needFix: options.needFix ?? false });
  }
}

export class SwitchChainNotSupportedError extends BaseError {
  name = 'SwitchChainNotSupportedError';

  constructor(
    message = 'Switching network is not supported, please operate in the wallet.',
    options: BaseErrorOptions = {},
  ) {
    super(message, { ...options, needFix: options.needFix ?? false });
  }
}

export class ContractInvocationError extends BaseError {
  name = 'ContractInvocationError';

  constructor(message = 'Contract invocation failed.', options: BaseErrorOptions = {}) {
    super(message, options);
  }
}

export class UnknownNeoError extends BaseError {
  name = 'UnknownNeoError';

  constructor(message = 'Unknown Neo error.', options: BaseErrorOptions = {}) {
    super(message, options);
  }
}
