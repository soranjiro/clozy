"use client";

import { useState, forwardRef, useImperativeHandle, useContext } from 'react';
import Link from 'next/link';
import { UserContext } from '../context/UserContext';

const HamburgerMenu = forwardRef((props, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useContext(UserContext);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  useImperativeHandle(ref, () => ({
    closeMenu() {
      setIsOpen(false);
    }
  }));

  return (
    <div className="relative">
      <button
        onClick={toggleMenu}
        className="focus:outline-none"
        type="button"
        aria-label="Toggle menu"
      >
        <div className="w-6 h-0.5 bg-white mb-1"></div>
        <div className="w-6 h-0.5 bg-white mb-1"></div>
        <div className="w-6 h-0.5 bg-white"></div>
      </button>
      <div
        className={`fixed top-0 right-0 min-h-screen w-64 shadow-xl transform transition-transform z-50 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="bg-menu-wood min-h-screen flex flex-col p-4">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="self-end mt-2 mb-2 focus:outline-none"
            aria-label="Close menu"
          >
            <div className="w-6 h-0.5 bg-gray-800 mb-1 rotate-45 transform"></div>
            <div className="w-6 h-0.5 bg-gray-800 -rotate-45 transform"></div>
          </button>
          <h2 className="text-2xl text-black font-bold mb-4">Menu</h2>
          <Link
            href="/clothes"
            className="block px-4 py-2 text-gray-800 border border-amber-700 hover:bg-amber-500"
          >
            Clothes List
          </Link>
          <Link
            href="/addClothes"
            className="block px-4 py-2 text-gray-800 border border-amber-700 hover:bg-amber-500"
          >
            Add Clothes
          </Link>
          <Link
            href="/calendar"
            className="block px-4 py-2 text-gray-800 border border-amber-700 hover:bg-amber-500"
          >
            Calendar
          </Link>
          <Link
            href="/account"
            className="block px-4 py-2 text-gray-800 border border-amber-700 hover:bg-amber-500"
          >
            Account Info
          </Link>
          <button
            type="button"
            onClick={logout}
            className="block mt-5 px-4 py-2 text-gray-800 text-left border border-amber-700 hover:bg-amber-700"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
});

HamburgerMenu.displayName = 'HamburgerMenu';

export default HamburgerMenu;
