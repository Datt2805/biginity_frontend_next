"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const HomePage = () => {
  const treeSectionRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      treeSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-gray-50 to-gray-200 overflow-hidden relative">

      {/* Loader */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-[60] bg-black"
          >
            <Image
              src="/loader.png"
              alt="Loader"
              fill
              className="object-cover opacity-90"
            />

            <motion.div
              className="absolute bottom-20 text-white text-xl font-semibold"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.2 }}
            >
              Loading...
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tree Section */}
      <section
        ref={treeSectionRef}
        className="relative h-screen flex items-center justify-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="text-center px-4"
        >
          <h2 className="text-3xl md:text-5xl font-semibold text-gray-800">
            Knowledge Blossoms Like a Tree
          </h2>

          <p className="mt-4 text-lg md:text-2xl text-gray-600">
            What begins as a foundation grows into wisdom, strength, and beauty.
          </p>
        </motion.div>
      </section>
    </main>
  );
};

export default HomePage;
