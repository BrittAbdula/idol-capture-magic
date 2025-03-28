
import React from 'react';
import Navbar from './Navbar';
import ThemeSwitcher from './ThemeSwitcher';

interface NavbarThemedProps {
  // We don't need any props for now, but we can add them if needed
}

const NavbarThemed: React.FC<NavbarThemedProps> = () => {
  return (
    <div className="relative">
      <Navbar />
      <div className="absolute top-0 right-0 p-4 z-50">
        <ThemeSwitcher />
      </div>
    </div>
  );
};

export default NavbarThemed;
