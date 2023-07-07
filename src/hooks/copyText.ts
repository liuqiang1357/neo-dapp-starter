import { App } from 'antd';
import copy from 'clipboard-copy';
import { useTranslation } from 'react-i18next';

export function useCopyText(): (text: string) => void {
  const { t } = useTranslation();
  const { message } = App.useApp();

  return (text: string) => {
    copy(text);
    message.success(t('messages.copied', { text }));
  };
}
