import { DrawerLeft } from '@/components/layout';
import { Outlet } from 'react-router-dom';

const Memo = () => {
  return (
    <DrawerLeft>
      <Outlet />
    </DrawerLeft>
  );
};

export default Memo;
