"use client";

import Link from 'next/link';
import HamburgerMenu from './hamburgerMenu';
import { useRef, useContext } from 'react';
import { UserContext } from '@/context/UserContext';

const Header = ({ title }: { title: string }) => {
  const menuRef = useRef<HTMLElement | null>(null);
  const { user } = useContext(UserContext);

  return (
    <header className="relative z-50 flex justify-between items-center p-4 bg-header-wood text-white">
      <div className="absolute inset-0 bg-black opacity-70"></div>
      <div className="relative flex-1 text-lg font-bold">
        <Link href="/">Clozy</Link>
      </div>
      <div className="relative flex-1 text-lg font-bold text-center">
        {title}
      </div>
      <div className="relative flex-1 flex justify-end">
        {user && <HamburgerMenu ref={menuRef} />}
      </div>
    </header>
  );
};

export default Header;
