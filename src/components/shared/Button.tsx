import { Button as AntButton, ConfigProvider } from 'antd';
import { ComponentProps, ComponentRef, forwardRef, MouseEventHandler } from 'react';
import { LinkProps, useHref, useLinkClickHandler } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { omitUndefined } from 'utils/misc';
import { tw } from 'utils/tailwind';

type AntButtonProps = ComponentProps<typeof AntButton>;

type Props = Omit<AntButtonProps, 'type' | 'loading'> &
  Omit<LinkProps, 'to'> & {
    type?: AntButtonProps['type'] | 'unstyled';
    loading?: boolean;
    to?: LinkProps['to'];
    colorPrimary?: string;
    colorText?: string;
    onClick?: MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  };

export const Button = forwardRef<ComponentRef<typeof AntButton>, Props>(
  (
    {
      className,
      type = 'unstyled',
      href,
      target,
      loading = false,
      disabled = false,
      onClick,
      to,
      replace,
      state,
      preventScrollReset,
      relative,
      colorPrimary,
      colorText,
      ...props
    },
    ref,
  ) => {
    let baseClassName = tw`inline-flex items-center justify-center no-underline`;

    let finalType: AntButtonProps['type'];
    const finalDisabled = loading || disabled;

    switch (type) {
      case 'unstyled':
        finalType = 'text';
        baseClassName += tw` h-auto border-none p-0 text-[color:inherit] transition-all duration-300 font-[number:inherit] ${
          finalDisabled ? 'opacity-30' : 'hover:opacity-60'
        }`;
        break;
      default:
        finalType = type;
    }

    let linkHref: string | null = useHref(to ?? '');
    linkHref = to != null ? linkHref : null;

    const finalHref = finalDisabled ? null : linkHref ?? href;

    let linkOnClick: MouseEventHandler<HTMLElement> | null = useLinkClickHandler<HTMLElement>(
      to ?? '',
      {
        replace,
        state,
        target,
        preventScrollReset,
        relative,
      },
    );
    linkOnClick = to != null ? linkOnClick : null;

    const finalOnClick: Props['onClick'] = event => {
      onClick?.(event);
      if (!event.defaultPrevented) {
        linkOnClick?.(event);
      }
    };

    return (
      <ConfigProvider
        theme={{
          token: omitUndefined({
            colorPrimary,
            colorText: type === 'unstyled' ? 'invalid' : colorText,
            colorTextDisabled: type === 'unstyled' ? 'invalid' : undefined,
            colorBgTextHover: type === 'unstyled' ? 'invalid' : undefined,
            colorBgTextActive: type === 'unstyled' ? 'invalid' : undefined,
          }),
        }}
      >
        <AntButton
          ref={ref}
          className={twMerge(baseClassName, className)}
          type={finalType}
          href={finalHref ?? undefined}
          target={target}
          loading={loading}
          disabled={finalDisabled}
          onClick={finalOnClick}
          {...props}
        />
      </ConfigProvider>
    );
  },
);
