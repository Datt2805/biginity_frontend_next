"use client";

import Image from "next/image";
import Link from "next/link";
import Logo from "../../public/logo.png";
import { TfiAlignJustify, TfiClose } from "react-icons/tfi";
import { useState, useEffect } from "react";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle Scroll Effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNav = () => setMenuOpen(!menuOpen);

  return (
    <>
      {/* Main Navbar */}
      <nav
        className={`fixed w-full h-20 z-50 transition-all duration-300 ease-in-out ${
          scrolled
            ? "bg-white/80 backdrop-blur-xl backdrop-saturate-150 shadow-sm border-b border-white/20"
            : "bg-transparent"
        }`}
      >
        <div className="flex justify-between items-center h-full w-full px-6 md:px-12">
          
          {/* Logo Section */}
          <Link href="/" className="relative z-50">
            <div className="flex items-center gap-2 group cursor-pointer">
              <Image
                src={Logo}
                alt="Beginity Logo"
                width={45}
                height={45}
                className="group-hover:rotate-6 transition-transform duration-300"
                priority
              />
              <span className={`font-bold text-xl tracking-tight ${scrolled ? 'text-slate-900' : 'text-slate-800'}`}>
                Beginity
              </span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden sm:flex items-center gap-10">
            <ul className="flex items-center gap-10">
              <Link href="/events">
                <li className="text-sm font-semibold uppercase tracking-wide text-slate-600 hover:text-indigo-600 transition-colors duration-300 relative group cursor-pointer">
                  Events
                  {/* Animated Underline */}
                  <span className="absolute -bottom-1 left-1/2 w-0 h-0.5 bg-indigo-600 transition-all duration-300 group-hover:w-full group-hover:left-0"></span>
                </li>
              </Link>
            </ul>

            {/* Premium CTA Button */}
            <Link href="/LoginSignUp">
              <button className="relative px-7 py-2.5 rounded-full bg-slate-900 text-white text-sm font-semibold shadow-lg shadow-slate-900/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group">
                 {/* Gradient Hover Effect Layer */}
                 <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                 {/* Text Layer */}
                 <span className="relative z-10">Sign In / Sign Up</span>
              </button>
            </Link>
          </div>

          {/* Mobile Menu Icon */}
          <div onClick={handleNav} className="sm:hidden cursor-pointer p-2 rounded-lg hover:bg-slate-100/50 transition-colors text-slate-800">
            <TfiAlignJustify size={26} />
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay (Backdrop) */}
      <div 
        className={
          menuOpen 
            ? "fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 sm:hidden transition-opacity duration-300 ease-in-out opacity-100" 
            : "fixed inset-0 bg-slate-900/0 z-[-1] sm:hidden transition-opacity duration-300 ease-in-out opacity-0"
        }
        onClick={() => setMenuOpen(false)}
      ></div>

      {/* Mobile Menu Drawer (Phone View) */}
      <div
        className={
          menuOpen
            ? "fixed right-0 top-0 w-[80%] sm:w-[60%] h-screen bg-white z-50 p-8 ease-out duration-300 shadow-2xl flex flex-col"
            : "fixed right-[-100%] top-0 w-[80%] h-screen bg-white z-50 p-10 ease-in duration-300 flex flex-col"
        }
      >
        {/* Mobile Header */}
        <div className="flex w-full items-center justify-between border-b border-slate-100 pb-6 mb-8">
          <div className="flex items-center gap-2">
             <Image src={Logo} alt="Beginity Logo" width={35} height={35} />
             <span className="font-bold text-lg text-slate-800">Beginity</span>
          </div>
          <div 
            onClick={handleNav} 
            className="cursor-pointer p-2 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <TfiClose size={18} />
          </div>
        </div>

        {/* Mobile Content */}
        <div className="flex flex-col h-full">
          
          {/* Menu Items */}
          <ul className="flex flex-col gap-2">
            <Link href="/events">
              <li
                onClick={() => setMenuOpen(false)}
                className="text-lg font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 px-4 py-3 rounded-xl transition-all"
              >
                Events
              </li>
            </Link>
          </ul>

          {/* Bottom Actions (Sign In / Sign Up) */}
          <div className="mt-auto mb-6 space-y-4">
             <Link href="/LoginSignUp">
              <button 
                onClick={() => setMenuOpen(false)}
                className="w-full py-3.5 rounded-xl bg-slate-900 text-white font-semibold shadow-xl shadow-slate-200 active:scale-95 transition-transform"
              >
                Sign In / Sign Up
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;