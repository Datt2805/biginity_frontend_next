"use client";

import Image from "next/image";
import Link from "next/link";
import Logo from "../../public/logo.png";
import { TfiAlignJustify, TfiClose } from "react-icons/tfi";
import { useState } from "react";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const handleNav = () => {
    setMenuOpen(!menuOpen);
  };
  return (
    <>
      <nav className="fixed w-full h-24 shadow-xl bg-white mb-10">
        <div className="flex justify-between items-center h-full w-full px-4 2xl:px-16">
          <Link href="/">
            <Image
              src={Logo}
              alt="Logo"
              width="50"
              height="50"
              className="cursor-pointer"
              priority
            />
          </Link>

          {/* contents */}

          <div className="hidden sm:flex">
            <ul className="hidden sm:flex">
              <Link href="/events">
                <li className="ml-10 uppercase hover:border-b font-semibold cursor-pointer">
                  Events
                </li>
              </Link>
              <Link href="/LoginSignUp">
                <li className="ml-10 uppercase hover:border-b font-semibold cursor-pointer">
                  Login/Signup
                </li>
              </Link>
            </ul>
          </div>
          <div onClick={handleNav} className="sm:hidden cursor-pointer pl-24">
            <TfiAlignJustify size={25} />
          </div>
        </div>
        <div
          className={
            menuOpen
              ? "fixed left-0 top-0 w-[65%] sm:hidden h-screen bg-[#ecf0f3] p-10 ease-in duration-500"
              : "fixed left-[-100%] top-0 p-10 ease-in duration-500"
          }
        >
          <div className="flex w-full items-center justify-end">
            <div onClick={handleNav} className="cursor-pointer">
              <TfiClose size={25} />
            </div>
          </div>
          <div className="flex-col py-4">
            <ul>
              <Link href="/events">
                <li
                  onClick={() => {
                    setMenuOpen(false);
                  }}
                  className="py-4 uppercase cursor-pointer font-semibold"
                >
                  Events
                </li>
              </Link>
              <Link href="/LoginSignUp">
                <li
                  onClick={() => {
                    setMenuOpen(false);
                  }}
                  className="py-4 uppercase cursor-pointer font-semibold"
                >
                  Login/Signup
                </li>
              </Link>
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
