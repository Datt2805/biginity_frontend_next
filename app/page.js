"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "./components/NavBar";

const HomePage = () => {
  const treeSectionRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSimulator = setTimeout(() => {
      setLoading(false);
      treeSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }, 2500);

    return () => clearTimeout(fetchSimulator);
  }, []);

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-gray-50 to-gray-200 overflow-hidden relative">
      {/* Navbar */}
      <div className="fixed top-0 left-0 w-full z-50">
        <Navbar />
      </div>

      {/* Full-Screen Loader */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="full-loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
            className="fixed inset-0 flex items-center justify-center z-50 bg-black"
          >
            <Image
              src="/loader.png"
              alt="Loader"
              fill
              className="object-cover opacity-90"
              priority
            />
            <motion.div
              className="absolute bottom-20 text-white text-xl font-semibold"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                repeat: Infinity,
                repeatType: "reverse",
                duration: 1.2,
              }}
            >
              Loading...
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Section */}
      <section
        ref={treeSectionRef}
        className="relative h-screen flex items-center justify-center z-10"
      >
        <motion.div
          initial={{ opacity: 0, scale: 1.1 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5 }}
          viewport={{ once: true }}
          className="absolute inset-0 flex items-center justify-center -z-10"
        />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 1 }}
          viewport={{ once: true }}
          className="z-10 text-center px-4 sticky top-1/3"
        >
          <h2 className="text-3xl md:text-5xl font-semibold text-gray-800 drop-shadow-lg">
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
