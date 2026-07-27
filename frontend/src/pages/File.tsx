import { DrawerLeft } from '@/components/layout';
import { Outlet } from 'react-router-dom';

const File = () => {
  return (
    <DrawerLeft>
      <Outlet />
    </DrawerLeft>
  );
};

export default File;
