"use client";

import React from "react";
import { motion } from "framer-motion";
import { DotGlobeHero } from "@/components/ui/globe-hero";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { ArrowRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import meetingDashboardImage from "../../assets/meeting-dashboard.webp";

export function ScrollImageSection() {
  return (
    <section className="bg-black py-10 md:py-16">
      <ContainerScroll titleComponent={<div className="h-0" />}>
        <img
          src={meetingDashboardImage}
          alt="Meeting AI dashboard showing meeting list, transcripts, and AI-generated summaries"
          className="mx-auto rounded-2xl object-cover h-full w-full object-center"
          draggable={false}
        />
      </ContainerScroll>
    </section>
  );
}

export default function DotGlobeHeroDemo() {
  return (
    <DotGlobeHero
      rotationSpeed={0.004}
      className="relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse" />

      <div className="relative z-10 text-center space-y-10 max-w-5xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/10 border border-white/30 backdrop-blur-xl shadow-2xl"
          >
            <div className="w-2 h-2 bg-white rounded-full animate-ping" />
            <span className="relative z-10 text-sm font-bold text-white tracking-wider uppercase">MEETING OWL</span>
            <div className="w-2 h-2 bg-white rounded-full animate-ping" />
          </motion.div>

          <div className="space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] select-none"
            >
              <span className="block font-light text-white/70 mb-3 text-3xl md:text-5xl">
                Smart Collaboration
              </span>
              <span className="block text-white">
                for Every Meeting
              </span>
            </motion.h1>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="max-w-3xl mx-auto space-y-4"
          >
            <p className="text-lg md:text-2xl text-white/90 leading-relaxed font-medium">
              Create individual, group, and live meetings with organization support,
              AI chat assistance, and clearer post-meeting outcomes.
            </p>
            <p className="text-base md:text-lg text-white/70 leading-relaxed">
              Keep planning, participation, and follow-ups in one reliable workspace.
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2"
        >
          <Link to="/signup">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-xl font-semibold text-lg shadow-xl"
            >
              <span className="tracking-wide">Start Exploring</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
            </motion.button>
          </Link>

          <Link to="/dashboard">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group inline-flex items-center gap-3 px-8 py-4 border-2 border-white/40 rounded-xl font-semibold text-lg text-white bg-black/50 backdrop-blur-xl"
            >
              <Zap className="w-5 h-5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />
              <span className="tracking-wide">View Live Demo</span>
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </DotGlobeHero>
  );
}
