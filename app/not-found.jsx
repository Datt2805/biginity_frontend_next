"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export const NotFound = () => {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Animated 404 Text */}
      <motion.h1
        className="text-9xl font-bold drop-shadow-lg"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
      >
        404
      </motion.h1>

      {/* Subtitle */}
      <motion.h2
        className="mt-4 text-3xl font-semibold"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        Page not found 👀
      </motion.h2>

      {/* Floating Emoji Animation */}
      <motion.div
        className="text-6xl mt-6"
        animate={{ y: [0, -15, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        🚀
      </motion.div>

      {/* Button Link */}
      <motion.div
        className="mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <Link
          href="/"
          className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-medium shadow-lg hover:bg-blue-500 transition-all"
        >
          Go Home
        </Link>
      </motion.div>
    </main>
  );
};

export default NotFound;
