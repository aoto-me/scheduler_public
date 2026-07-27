import { DrawerLeft } from '@/components/layout';
import { Outlet } from 'react-router-dom';

const Gallery = () => {
  return (
    <DrawerLeft>
      <Outlet />
    </DrawerLeft>
  );
};

export default Gallery;
