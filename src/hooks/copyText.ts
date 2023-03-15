import { message } from 'antd';
import copy from 'clipboard-copy';
import { useTranslation } from 'react-i18next';

export function useCopyText(): (text: string) => void {
  const { t } = useTranslation();

  return (text: string) => {
    copy(text);
    message.success(t('common:messages.copied', { text }));
  };
}
