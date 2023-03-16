import { ConfigProvider } from 'antd';
import { FC, useLayoutEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Home } from 'components/home';
import { antdTheme } from 'utils/antdTheme';
import { ErrorHandlder } from './ErrorHandler';

export const App: FC = () => {
  const location = useLocation();

  useLayoutEffect(() => {
    document.scrollingElement?.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <ConfigProvider theme={antdTheme}>
      <Routes>
        <Route index element={<Home />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <ErrorHandlder />
    </ConfigProvider>
  );
};
