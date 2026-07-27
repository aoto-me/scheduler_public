import { DrawerLeft } from '@/components/layout';
import { Outlet } from 'react-router-dom';

const Project = () => (
  <DrawerLeft>
    <Outlet />
  </DrawerLeft>
);

export default Project;
