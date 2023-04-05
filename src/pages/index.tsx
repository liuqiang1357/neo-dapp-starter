import { App as AntApp, ConfigProvider } from 'antd';
import { FC, useLayoutEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Home } from 'pages/home';
import { antdTheme } from 'utils/antdTheme';
import { ErrorHandlder } from './ErrorHandler';

export const App: FC = () => {
  const location = useLocation();

  useLayoutEffect(() => {
    document.scrollingElement?.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <ConfigProvider theme={antdTheme}>
      <AntApp className="flex min-h-0 grow flex-col">
        <Routes>
          <Route index element={<Home />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <ErrorHandlder />
      </AntApp>
    </ConfigProvider>
  );
};
