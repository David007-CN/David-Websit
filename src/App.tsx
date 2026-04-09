/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Twitter, 
  Menu, 
  X,
  Shield,
  Target,
  Zap,
  Award,
  Facebook,
  Instagram,
  Youtube,
  Layout,
  Palette,
  Play,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Project } from './types';
import { PROJECTS } from './data/projects';

// --- Utilities ---
const getOptimizedUrl = (url: string) => {
  if (!url) return url;
  
  // Convert GitHub blob URLs to jsDelivr CDN URLs for faster loading
  if (url.includes('github.com') && url.includes('/blob/')) {
    try {
      const parts = url.replace('https://github.com/', '').split('/');
      const user = parts[0];
      const repo = parts[1];
      const branch = parts[3];
      const path = parts.slice(4).join('/').split('?')[0];
      return `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/${path}`;
    } catch (e) {
      return url;
    }
  }

  // Convert raw.githubusercontent.com to jsDelivr CDN URLs
  if (url.includes('raw.githubusercontent.com')) {
    try {
      const parts = url.replace('https://raw.githubusercontent.com/', '').split('/');
      const user = parts[0];
      const repo = parts[1];
      const branch = parts[2];
      const path = parts.slice(3).join('/').split('?')[0];
      return `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/${path}`;
    } catch (e) {
      return url;
    }
  }

  return url;
};

const getVideoThumbnail = (url: string, manualCover?: string) => {
  if (manualCover && !manualCover.includes('img.bilibili.com') && !manualCover.includes('picsum.photos/seed/video')) {
    return manualCover;
  }
  
  // YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const id = url.includes('youtu.be') 
      ? url.split('/').pop()?.split('?')[0] 
      : new URLSearchParams(new URL(url).search).get('v');
    if (id) return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
  }
  
  // Bilibili - Fallback to manual or a themed placeholder
  return manualCover || "https://picsum.photos/seed/video/1920/1080";
};

// --- Mock Data ---
const ARCHIVE_PROJECTS: Project[] = [
  {
    id: 1,
    title: "Design",
    subtitle: "Not decoration. Problem solving.",
    category: "Design",
    image: "https://picsum.photos/seed/design/1280/720",
    galleryImages: [
      { url: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/04_Osight%20C%20launch%20banner_1920x1080.jpg?raw=true", cover: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/04_Osight%20C%20launch%20banner_1920x1080.jpg?raw=true", title: "Osight C Launch Banner" },
      { url: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/01_Osight%20SE%206MOA%20GN%20launch%20banner_1920x1080.jpg?raw=true", cover: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/01_Osight%20SE%206MOA%20GN%20launch%20banner_1920x1080.jpg?raw=true", title: "Osight SE Launch Banner" },
      { url: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/06_Osight%20C%20Teaser_1920x1080.jpg?raw=true", cover: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/06_Osight%20C%20Teaser_1920x1080.jpg?raw=true", title: "Osight C Teaser" },
      { url: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/03_C%20and%20K%20Teaser_1920x1080.jpg?raw=true", cover: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/03_C%20and%20K%20Teaser_1920x1080.jpg?raw=true", title: "C and K Teaser" },
      { url: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/02_SE%20GN%206%20MOA%20Trial%20sales_1920x1080.jpg?raw=true", cover: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/02_SE%20GN%206%20MOA%20Trial%20sales_1920x1080.jpg?raw=true", title: "SE GN Trial Sales" },
      { url: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/05_Osight%20C%20launch%20banner_1920x1080.jpg?raw=true", cover: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/05_Osight%20C%20launch%20banner_1920x1080.jpg?raw=true", title: "Osight C Banner Without Gun" },
      { url: "https://picsum.photos/seed/design-7/1920/1080", cover: "https://picsum.photos/seed/design-7/1920/1080", title: "Design Project 7" },
      { url: "https://picsum.photos/seed/design-8/1920/1080", cover: "https://picsum.photos/seed/design-8/1920/1080", title: "Design Project 8" },
      { url: "https://picsum.photos/seed/design-9/1920/1080", cover: "https://picsum.photos/seed/design-9/1920/1080", title: "Design Project 9" },
      { url: "https://picsum.photos/seed/design-10/1920/1080", cover: "https://picsum.photos/seed/design-10/1920/1080", title: "Design Project 10" },
      { url: "https://picsum.photos/seed/design-11/1920/1080", cover: "https://picsum.photos/seed/design-11/1920/1080", title: "Design Project 11" },
      { url: "https://picsum.photos/seed/design-12/1920/1080", cover: "https://picsum.photos/seed/design-12/1920/1080", title: "Design Project 12" },
      { url: "https://picsum.photos/seed/design-13/1920/1080", cover: "https://picsum.photos/seed/design-13/1920/1080", title: "Design Project 13" },
      { url: "https://picsum.photos/seed/design-14/1920/1080", cover: "https://picsum.photos/seed/design-14/1920/1080", title: "Design Project 14" },
      { url: "https://picsum.photos/seed/design-15/1920/1080", cover: "https://picsum.photos/seed/design-15/1920/1080", title: "Design Project 15" },
      { url: "https://picsum.photos/seed/design-16/1920/1080", cover: "https://picsum.photos/seed/design-16/1920/1080", title: "Design Project 16" },
      { url: "https://picsum.photos/seed/design-17/1920/1080", cover: "https://picsum.photos/seed/design-17/1920/1080", title: "Design Project 17" },
      { url: "https://picsum.photos/seed/design-18/1920/1080", cover: "https://picsum.photos/seed/design-18/1920/1080", title: "Design Project 18" },
      { url: "https://picsum.photos/seed/design-19/1920/1080", cover: "https://picsum.photos/seed/design-19/1920/1080", title: "Design Project 19" },
      { url: "https://picsum.photos/seed/design-20/1920/1080", cover: "https://picsum.photos/seed/design-20/1920/1080", title: "Design Project 20" },
      { url: "https://picsum.photos/seed/design-21/1920/1080", cover: "https://picsum.photos/seed/design-21/1920/1080", title: "Design Project 21" },
    ]
  },
  {
    id: 2,
    title: "Photography",
    subtitle: "More than images.",
    category: "Photography",
    image: "https://github.com/David007-CN/DW/blob/main/Cover/01_fly.jpg?raw=true",
    galleryImages: [
      { url: "https://picsum.photos/seed/photo-1/1920/1080", cover: "https://picsum.photos/seed/photo-1/1920/1080", title: "Photography Project 1" },
      { url: "https://picsum.photos/seed/photo-2/1920/1080", cover: "https://picsum.photos/seed/photo-2/1920/1080", title: "Photography Project 2" },
      { url: "https://picsum.photos/seed/photo-3/1920/1080", cover: "https://picsum.photos/seed/photo-3/1920/1080", title: "Photography Project 3" },
      { url: "https://picsum.photos/seed/photo-4/1920/1080", cover: "https://picsum.photos/seed/photo-4/1920/1080", title: "Photography Project 4" },
      { url: "https://picsum.photos/seed/photo-5/1920/1080", cover: "https://picsum.photos/seed/photo-5/1920/1080", title: "Photography Project 5" },
      { url: "https://picsum.photos/seed/photo-6/1920/1080", cover: "https://picsum.photos/seed/photo-6/1920/1080", title: "Photography Project 6" },
      { url: "https://picsum.photos/seed/photo-7/1920/1080", cover: "https://picsum.photos/seed/photo-7/1920/1080", title: "Photography Project 7" },
      { url: "https://picsum.photos/seed/photo-8/1920/1080", cover: "https://picsum.photos/seed/photo-8/1920/1080", title: "Photography Project 8" },
      { url: "https://picsum.photos/seed/photo-9/1920/1080", cover: "https://picsum.photos/seed/photo-9/1920/1080", title: "Photography Project 9" },
      { url: "https://picsum.photos/seed/photo-10/1920/1080", cover: "https://picsum.photos/seed/photo-10/1920/1080", title: "Photography Project 10" },
      { url: "https://picsum.photos/seed/photo-11/1920/1080", cover: "https://picsum.photos/seed/photo-11/1920/1080", title: "Photography Project 11" },
      { url: "https://picsum.photos/seed/photo-12/1920/1080", cover: "https://picsum.photos/seed/photo-12/1920/1080", title: "Photography Project 12" },
      { url: "https://picsum.photos/seed/photo-13/1920/1080", cover: "https://picsum.photos/seed/photo-13/1920/1080", title: "Photography Project 13" },
      { url: "https://picsum.photos/seed/photo-14/1920/1080", cover: "https://picsum.photos/seed/photo-14/1920/1080", title: "Photography Project 14" },
      { url: "https://picsum.photos/seed/photo-15/1920/1080", cover: "https://picsum.photos/seed/photo-15/1920/1080", title: "Photography Project 15" },
      { url: "https://picsum.photos/seed/photo-16/1920/1080", cover: "https://picsum.photos/seed/photo-16/1920/1080", title: "Photography Project 16" },
      { url: "https://picsum.photos/seed/photo-17/1920/1080", cover: "https://picsum.photos/seed/photo-17/1920/1080", title: "Photography Project 17" },
      { url: "https://picsum.photos/seed/photo-18/1920/1080", cover: "https://picsum.photos/seed/photo-18/1920/1080", title: "Photography Project 18" },
    ]
  },
  {
    id: 3,
    title: "Retouching",
    subtitle: "Nothing left unnoticed.",
    category: "Retouching",
    image: "https://picsum.photos/seed/retouching/1280/720",
    galleryImages: [
      { url: "https://picsum.photos/seed/retouch-1/1920/1080", cover: "https://picsum.photos/seed/retouch-1/1920/1080", title: "Retouching Project 1" },
      { url: "https://picsum.photos/seed/retouch-2/1920/1080", cover: "https://picsum.photos/seed/retouch-2/1920/1080", title: "Retouching Project 2" },
      { url: "https://picsum.photos/seed/retouch-3/1920/1080", cover: "https://picsum.photos/seed/retouch-3/1920/1080", title: "Retouching Project 3" },
      { url: "https://picsum.photos/seed/retouch-4/1920/1080", cover: "https://picsum.photos/seed/retouch-4/1920/1080", title: "Retouching Project 4" },
      { url: "https://picsum.photos/seed/retouch-5/1920/1080", cover: "https://picsum.photos/seed/retouch-5/1920/1080", title: "Retouching Project 5" },
      { url: "https://picsum.photos/seed/retouch-6/1920/1080", cover: "https://picsum.photos/seed/retouch-6/1920/1080", title: "Retouching Project 6" },
      { url: "https://picsum.photos/seed/retouch-7/1920/1080", cover: "https://picsum.photos/seed/retouch-7/1920/1080", title: "Retouching Project 7" },
      { url: "https://picsum.photos/seed/retouch-8/1920/1080", cover: "https://picsum.photos/seed/retouch-8/1920/1080", title: "Retouching Project 8" },
      { url: "https://picsum.photos/seed/retouch-9/1920/1080", cover: "https://picsum.photos/seed/retouch-9/1920/1080", title: "Retouching Project 9" },
      { url: "https://picsum.photos/seed/retouch-10/1920/1080", cover: "https://picsum.photos/seed/retouch-10/1920/1080", title: "Retouching Project 10" },
      { url: "https://picsum.photos/seed/retouch-11/1920/1080", cover: "https://picsum.photos/seed/retouch-11/1920/1080", title: "Retouching Project 11" },
      { url: "https://picsum.photos/seed/retouch-12/1920/1080", cover: "https://picsum.photos/seed/retouch-12/1920/1080", title: "Retouching Project 12" },
    ]
  },
  {
    id: 4,
    title: "AI Studio",
    subtitle: "Where ideas take form.",
    category: "AI Studio",
    image: "https://picsum.photos/seed/ai/1280/720",
    galleryImages: [
      { url: "https://picsum.photos/seed/ai-1/1920/1080", cover: "https://picsum.photos/seed/ai-1/1920/1080", title: "AI Studio Project 1" },
      { url: "https://picsum.photos/seed/ai-2/1920/1080", cover: "https://picsum.photos/seed/ai-2/1920/1080", title: "AI Studio Project 2" },
      { url: "https://picsum.photos/seed/ai-3/1920/1080", cover: "https://picsum.photos/seed/ai-3/1920/1080", title: "AI Studio Project 3" },
      { url: "https://picsum.photos/seed/ai-4/1920/1080", cover: "https://picsum.photos/seed/ai-4/1920/1080", title: "AI Studio Project 4" },
      { url: "https://picsum.photos/seed/ai-5/1920/1080", cover: "https://picsum.photos/seed/ai-5/1920/1080", title: "AI Studio Project 5" },
      { url: "https://picsum.photos/seed/ai-6/1920/1080", cover: "https://picsum.photos/seed/ai-6/1920/1080", title: "AI Studio Project 6" },
      { url: "https://picsum.photos/seed/ai-7/1920/1080", cover: "https://picsum.photos/seed/ai-7/1920/1080", title: "AI Studio Project 7" },
      { url: "https://picsum.photos/seed/ai-8/1920/1080", cover: "https://picsum.photos/seed/ai-8/1920/1080", title: "AI Studio Project 8" },
      { url: "https://picsum.photos/seed/ai-9/1920/1080", cover: "https://picsum.photos/seed/ai-9/1920/1080", title: "AI Studio Project 9" },
    ]
  },
  {
    id: 5,
    title: "Video",
    subtitle: "Primarily 3rd-party production, with our concept guidance.",
    category: "Video",
    image: "https://github.com/David007-CN/DW/blob/main/Cover/06_DSC06844.jpg?raw=true",
    galleryImages: [
      { 
        url: "https://youtu.be/bLBBiNbUMQ4", 
        title: "Pending refinement - Video 1"
      },
      { 
        url: "https://youtu.be/A_TdfLXRKCQ", 
        title: "Pending refinement - Video 2"
      },
       { 
        url: "https://www.bilibili.com/video/BV1oNkTBnErQ?t=79.5", 
        cover: "https://github.com/David007-CN/DW/blob/main/Cover/06_DSC06844.jpg?raw=true",
        title: "Pending refinement - Video 3"
      },
    ]
  }
];

const EXPERIENCE = [
  {
    year: "2024.12 - PRESENT",
    brand: "Osight",
    role: "1000+ Employees",
    logo: "https://raw.githubusercontent.com/David007-CN/DW/refs/heads/main/Logo/LOGO_OS.jpg",
    description: "An independent brand under Olight, specializing in red dot sights and tactical products. Founded just over a year ago, it achieved over 160 million in revenue in its first year, growing from a team of around 10 to nearly 100."
  },
  {
    year: "2022.04 - 2024.02",
    brand: "Hipa",
    role: "~100 Employees",
    logo: "https://github.com/David007-CN/DW/blob/main/Logo/LOGO_HI.jpg?raw=true",
    description: "A top-performing Amazon seller in the garden accessories category, specializing in lawn mower carburetors, air filters, mulching blades, and chainsaw chains, with strong sales performance and consistent growth."
  },
  {
    year: "2018.09 - 2022.02",
    brand: "Olight ",
    role: "1000+ Employees",
    logo: "https://github.com/David007-CN/DW/blob/main/Logo/LOGO_OL.jpg?raw=true",
    description: "Olight is a globally recognized flashlight brand, known for its strong brand awareness and recognition in the U.S. market. Its Facebook groups, YouTube channel, and Instagram account each have over 200,000 followers."
  }
];

const SERVICES = [
  {
    title: "Visual Identity",
    description: "Crafting unique brand languages that command attention and define industry standards.",
    icon: <Palette size={24} />
  },
  {
    title: "Digital Architecture",
    description: "Building robust, scalable UI systems that bridge the gap between form and function.",
    icon: <Layout size={24} />
  },
  {
    title: "Motion Narratives",
    description: "Bringing brands to life through cinematic motion graphics and storytelling animations.",
    icon: <Zap size={24} />
  }
];

const FEATURED_ITEMS: Project[] = [
  { id: 101, title: "Morning Ritual", category: "Daily Life", image: "https://picsum.photos/seed/morning/400/500", time: "2 0 2 4 . 0 3" },
  { id: 102, title: "Urban Exploration", category: "Travel", image: "https://picsum.photos/seed/urban/400/500", time: "2 0 2 3 . 1 1" },
  { id: 103, title: "Evening Sketch", category: "Play", image: "https://picsum.photos/seed/sketch/400/500", time: "2 0 2 3 . 0 8" },
  { id: 104, title: "Coffee Break", category: "Relaxation", image: "https://picsum.photos/seed/coffee/400/500", time: "2 0 2 2 . 1 2" },
  { id: 105, title: "Night Drive", category: "Atmosphere", image: "https://picsum.photos/seed/night-drive/400/500", time: "2 0 2 2 . 0 5" },
  { id: 106, title: "Weekend Hike", category: "Nature", image: "https://picsum.photos/seed/hike/400/500", time: "2 0 2 1 . 0 9" },
  { id: 107, title: "Golden Hour", category: "Photography", image: "https://picsum.photos/seed/golden/400/500", time: "2 0 2 4 . 0 1" },
  { id: 108, title: "Street Food", category: "Culture", image: "https://picsum.photos/seed/food/400/500", time: "2 0 2 3 . 0 9" },
  { id: 109, title: "Mountain Peak", category: "Adventure", image: "https://picsum.photos/seed/mountain/400/500", time: "2 0 2 3 . 0 7" },
  { id: 110, title: "Rainy Day", category: "Mood", image: "https://picsum.photos/seed/rain/400/500", time: "2 0 2 3 . 0 5" },
  { id: 111, title: "Summer Breeze", category: "Season", image: "https://picsum.photos/seed/summer/400/500", time: "2 0 2 3 . 0 6" },
  { id: 112, title: "Winter Solstice", category: "Season", image: "https://picsum.photos/seed/winter/400/500", time: "2 0 2 3 . 1 2" },
  { id: 113, title: "Ocean Waves", category: "Nature", image: "https://picsum.photos/seed/ocean/400/500", time: "2 0 2 4 . 0 2" },
  { id: 114, title: "Forest Path", category: "Discovery", image: "https://picsum.photos/seed/forest/400/500", time: "2 0 2 3 . 1 0" },
  { id: 115, title: "City Lights", category: "Urban", image: "https://picsum.photos/seed/city/400/500", time: "2 0 2 3 . 0 4" },
  { id: 116, title: "Library Silence", category: "Focus", image: "https://picsum.photos/seed/library/400/500", time: "2 0 2 2 . 1 1" },
  { id: 117, title: "Sunset Glow", category: "Beauty", image: "https://picsum.photos/seed/sunset/400/500", time: "2 0 2 2 . 1 0" },
  { id: 118, title: "Desert Sands", category: "Vastness", image: "https://picsum.photos/seed/desert/400/500", time: "2 0 2 2 . 0 8" },
  { id: 119, title: "Autumn Leaves", category: "Change", image: "https://picsum.photos/seed/autumn/400/500", time: "2 0 2 2 . 0 9" },
  { id: 120, title: "Spring Bloom", category: "Growth", image: "https://picsum.photos/seed/spring/400/500", time: "2 0 2 2 . 0 4" },
  { id: 121, title: "Starry Night", category: "Wonder", image: "https://picsum.photos/seed/stars/400/500", time: "2 0 2 2 . 0 3" },
  { id: 122, title: "Quiet Moment", category: "Peace", image: "https://picsum.photos/seed/quiet/400/500", time: "2 0 2 2 . 0 2" },
  { id: 123, title: "Busy Market", category: "Energy", image: "https://picsum.photos/seed/market/400/500", time: "2 0 2 2 . 0 1" },
  { id: 124, title: "Hidden Alley", category: "Mystery", image: "https://picsum.photos/seed/alley/400/500", time: "2 0 2 1 . 1 2" },
];

// --- Components ---

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'About Me', href: isHomePage ? '#about' : '/#about' },
    { name: 'Portfolio', href: isHomePage ? '#works' : '/#works' },
    { name: 'Services', href: isHomePage ? '#contact' : '/#contact' },
  ];

  return (
    <div className="fixed top-0 left-0 w-full z-50">
      <nav className={`w-full transition-all duration-300 relative z-10 bg-brand-dark border-b border-white/5 ${scrolled ? 'py-1' : 'py-2'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-12">
            <a 
              href={isHomePage ? "#home" : "/#home"}
              className="flex items-center"
              onClick={(e) => {
                if (isHomePage) {
                  e.preventDefault();
                  document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              <motion.img 
                whileHover={{ scale: 1.05 }}
                src={getOptimizedUrl("https://github.com/David007-CN/DW/blob/main/David%20Signature/David%20Signature%20red%20bold.png?raw=true")}
                alt="David Signature"
                className="h-10 md:h-12 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </a>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                link.href.startsWith('#') ? (
                  <a 
                    key={link.name} 
                    href={link.href} 
                    className="text-[11px] font-bold text-white/70 hover:text-white transition-colors uppercase tracking-[0.2em]"
                  >
                    {link.name}
                  </a>
                ) : (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="text-[11px] font-bold text-white/70 hover:text-white transition-colors uppercase tracking-[0.2em]"
                  >
                    {link.name}
                  </Link>
                )
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => {
                if (isHomePage) {
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                } else {
                  window.location.href = '/#contact';
                }
              }}
              className="px-6 py-2 bg-brand-red text-white text-[11px] font-bold uppercase tracking-widest hover:bg-white hover:text-brand-dark transition-all duration-300"
            >
              Contact Me
            </button>
          </div>

          {/* Mobile Toggle */}
          <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 w-full bg-brand-dark border-b border-white/5 py-8 px-6 flex flex-col gap-6 md:hidden"
            >
              {navLinks.map((link) => (
                link.href.startsWith('#') ? (
                  <a 
                    key={link.name} 
                    href={link.href} 
                    className="text-2xl font-display font-bold hover:text-brand-red transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </a>
                ) : (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="text-2xl font-display font-bold hover:text-brand-red transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </Link>
                )
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </div>
  );
};

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const slides = [
    {
      type: 'content',
      bg: "https://raw.githubusercontent.com/David007-CN/DW/refs/heads/main/David2_3840x2160_middle.jpg",
      content: (
        <div className="relative z-10 text-center max-w-5xl px-6 pt-32 md:pt-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          >
            <h1 className="text-3xl md:text-6xl lg:text-8xl font-yahei font-bold leading-tight tracking-tight mb-16 md:mb-24 lg:mb-32 flex flex-col items-center">
              <div className="relative inline-block max-w-full">
                <span>Hello, welcome</span>
                <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 md:mt-6 text-[8px] md:text-[10px] lg:text-xs font-yahei font-normal opacity-60 flex justify-center tracking-[0.1em] md:tracking-[0.35em] whitespace-nowrap w-[90vw] md:w-auto">
                  {"An unknown designer. More than just a designer.".split("").map((char, i) => (
                    <span key={i}>{char === " " ? "\u00A0" : char}</span>
                  ))}
                </span>
              </div>
            </h1>
            
            <div className="flex flex-wrap justify-center gap-6">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => document.getElementById('works')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-48 py-4 border border-white/20 bg-white/5 backdrop-blur-sm text-white font-bold uppercase tracking-widest text-xs"
              >
                LEARN MORE
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-48 py-4 bg-brand-red text-white font-bold uppercase tracking-widest text-xs"
              >
                CONTACT NOW
              </motion.button>
            </div>
          </motion.div>
        </div>
      )
    },
    {
      type: 'image',
      desktop: "https://picsum.photos/seed/hero-banner-1/1920/1080",
      mobile: "https://picsum.photos/seed/hero-banner-1-m/750/1334",
      alt: "Featured Work 1"
    }
  ];

  const handleNext = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const handlePrev = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  useEffect(() => {
    const timer = setInterval(handleNext, 10000);
    return () => clearInterval(timer);
  }, [currentSlide, slides.length]);

  return (
    <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden bg-brand-dark pt-[56px] md:pt-[64px] touch-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.x > 100) handlePrev();
            else if (info.offset.x < -100) handleNext();
          }}
          className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing"
        >
          {slides[currentSlide].type === 'content' ? (
            <>
              <div className="absolute inset-0 z-0 pointer-events-none">
                <img 
                  src={getOptimizedUrl(slides[currentSlide].bg!)} 
                  alt="Background" 
                  className="w-full h-full object-cover brightness-[0.38] contrast-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/50 via-transparent to-brand-dark/75" />
              </div>
              {slides[currentSlide].content}
            </>
          ) : (
            <div 
              className="absolute inset-0"
              onClick={(e) => {
                // Only navigate if it wasn't a drag
                if (Math.abs(e.movementX) < 5) {
                  document.getElementById('works')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              <img 
                src={getOptimizedUrl(slides[currentSlide].desktop!)} 
                alt={slides[currentSlide].alt}
                className="hidden md:block w-full h-full object-cover brightness-[0.6] hover:brightness-[0.8] transition-all duration-1000 pointer-events-none"
                referrerPolicy="no-referrer"
              />
              <img 
                src={getOptimizedUrl(slides[currentSlide].mobile!)} 
                alt={slides[currentSlide].alt}
                className="block md:hidden w-full h-full object-cover brightness-[0.6] pointer-events-none"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-brand-dark/40 pointer-events-none" />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button 
        onClick={(e) => { e.stopPropagation(); handlePrev(); }}
        className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center rounded-full bg-black/20 border border-white/10 text-white/40 hover:text-white hover:bg-black/40 hover:border-white/30 transition-all duration-300 z-30 group"
        aria-label="Previous Slide"
      >
        <ChevronLeft size={24} className="group-hover:-translate-x-0.5 transition-transform" />
      </button>
      <button 
        onClick={(e) => { e.stopPropagation(); handleNext(); }}
        className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center rounded-full bg-black/20 border border-white/10 text-white/40 hover:text-white hover:bg-black/40 hover:border-white/30 transition-all duration-300 z-30 group"
        aria-label="Next Slide"
      >
        <ChevronRight size={24} className="group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-4 z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentSlide(i);
            }}
            className={`w-3 h-3 transition-all duration-500 rounded-full border-2 ${
              currentSlide === i 
                ? 'bg-brand-red border-brand-red scale-125' 
                : 'bg-transparent border-white/30 hover:border-white/60'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

const FeatureSection = () => (
  <section id="about" className="py-16 md:py-24 lg:py-32 bg-brand-dark border-y border-white/5">
    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
      <motion.div 
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="relative aspect-square"
      >
        <img 
          src={getOptimizedUrl("https://raw.githubusercontent.com/David007-CN/DW/main/Profile%20Photo/Selfie_1600.jpg")} 
          alt="Designer Portrait" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 border-[20px] border-brand-dark/40 m-4" />
      </motion.div>
      
      <div>
        <div className="flex justify-center mb-8">
          <div className="w-12 h-[1px] bg-white/20 self-center" />
          <Award className="mx-6 text-white/40" size={32} />
          <div className="w-12 h-[1px] bg-white/20 self-center" />
        </div>
        <h2 className="text-3xl md:text-5xl font-display font-bold text-center mb-8">Good design<br className="block md:hidden" /> has a purpose.</h2>
        <p className="text-white/50 text-center text-base md:text-lg leading-relaxed mb-12 max-w-xl mx-auto px-4 md:px-0">
          High-end design is about precise expression. Designed to solve. Built to perform. 
          I remove unnecessary noise so the message is understood instantly and drives action. 
          Every detail serves a purpose.
        </p>
        
        <div className="grid grid-cols-3 gap-8">
          {[Target, Shield, Zap].map((Icon, i) => (
            <div key={i} className="flex flex-col items-center gap-4 opacity-40 hover:opacity-100 transition-opacity">
              <Icon size={24} />
              <div className="w-8 h-[1px] bg-white/20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

const ExperienceAndServices = () => (
  <section id="services" className="py-16 md:py-24 lg:py-32 bg-brand-dark border-t border-white/5">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-16 md:mb-24">
        <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Work & Capability</h2>
        <div className="w-24 h-[1px] bg-brand-red mx-auto" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-stretch">
        {/* Experience Timeline */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="mb-10 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">Track Record</h2>
            <div className="w-12 h-[1px] bg-brand-red" />
          </div>
          
          <div className="flex-grow space-y-12 relative before:absolute before:left-[23px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
            {EXPERIENCE.map((exp, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative pl-20"
              >
                <div className="absolute left-0 top-0 w-12 h-12 bg-brand-dark border border-white/10 p-1 z-10">
                  <img 
                    src={getOptimizedUrl(exp.logo)} 
                    alt={exp.brand} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex items-baseline justify-between mb-2 gap-2">
                  <h3 className="text-xl font-display font-bold tracking-tight">{exp.brand}</h3>
                  <span className="text-[10px] font-bold text-brand-red tracking-[0.2em]">{exp.year}</span>
                </div>
                <p className="text-xs font-bold text-white/40 tracking-widest mb-4">{exp.role}</p>
                <p className="text-sm text-white/50 leading-relaxed max-w-xl">
                  {exp.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="mb-10 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">What I Do</h2>
            <div className="w-12 h-[1px] bg-brand-red" />
          </div>
          
          <div className="flex-grow grid grid-cols-1 gap-8">
            {SERVICES.map((service, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-8 group hover:border-brand-red transition-colors flex flex-col h-full"
              >
                <div className="text-brand-red mb-6 group-hover:scale-110 transition-transform duration-300 inline-block">
                  {service.icon}
                </div>
                <h3 className="text-xl font-display font-bold mb-4 tracking-tight">{service.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed flex-grow">
                  {service.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Spotlight = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const project = PROJECTS[selectedIndex % PROJECTS.length];
  const currentImage = project.image;

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev - 1 + PROJECTS.length) % PROJECTS.length);
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev + 1) % PROJECTS.length);
  };
  
  return (
    <section id="expertise" className="relative py-16 md:py-24 lg:py-32 overflow-hidden bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-10 md:mb-16 lg:mb-20">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 max-w-md md:max-w-none mx-auto leading-tight">Selected Work</h2>
          <div className="w-24 h-[1px] bg-brand-red mx-auto" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-12">
          <div className="lg:col-span-4">
            <div className="grid grid-cols-6 gap-2">
              {PROJECTS.map((p, i) => {
                return (
                  <div 
                    key={i} 
                    onClick={() => setSelectedIndex(i)}
                    className={`aspect-video border cursor-pointer transition-all duration-300 ${selectedIndex === i ? 'border-brand-red ring-1 ring-brand-red' : 'border-white/10 hover:border-white/40'} bg-white/5`}
                  >
                    <img 
                      src={getOptimizedUrl(p.image)} 
                      className="w-full h-full object-cover transition-all duration-500" 
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="lg:col-span-8 flex flex-col justify-center items-center lg:items-end text-center lg:text-right min-h-[400px] mt-0 md:mt-16 lg:mt-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center lg:items-end w-full"
            >
              <div className="relative w-full max-w-2xl group">
                {/* Desktop Navigation Arrows */}
                <button 
                  onClick={handlePrev}
                  className="hidden lg:flex absolute -left-16 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:border-white/40 hover:bg-white/10 transition-all duration-300 z-20"
                  aria-label="Previous Project"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={handleNext}
                  className="hidden lg:flex absolute -right-16 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:border-white/40 hover:bg-white/10 transition-all duration-300 z-20"
                  aria-label="Next Project"
                >
                  <ChevronRight size={24} />
                </button>

                {/* Mobile Navigation Arrows */}
                <button 
                  onClick={handlePrev}
                  className="lg:hidden absolute top-2 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/60 hover:text-white z-20"
                  aria-label="Previous Project"
                >
                  <ChevronUp size={18} />
                </button>
                <button 
                  onClick={handleNext}
                  className="lg:hidden absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/60 hover:text-white z-20"
                  aria-label="Next Project"
                >
                  <ChevronDown size={18} />
                </button>

                <div className="w-full aspect-video mt-14 mb-14 lg:mt-0 lg:mb-8 border border-white/10 p-1 bg-white/5 backdrop-blur-sm">
                  <img 
                    src={getOptimizedUrl(currentImage)} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer" 
                  />
                </div>
              </div>
              
              <h4 className="text-sm font-bold text-white/90 mb-1 lg:mb-3">{project.title}</h4>
              <p className="max-w-md text-sm text-white/60 leading-relaxed italic">
                {project.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  </section>
  );
};

const Archive = () => {
  const navigate = useNavigate();
  
  return (
    <section id="works" className="py-16 md:py-24 lg:py-32 bg-brand-dark">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-10 md:mb-16 lg:mb-20">
          <h2 
            className="text-3xl md:text-5xl font-display font-bold mb-4 max-w-md md:max-w-none mx-auto leading-tight"
          >
            Visuals That Solve Problems
          </h2>
          <div className="w-24 h-[1px] bg-brand-red mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          {ARCHIVE_PROJECTS.map((project, index) => (
            <div 
              key={project.id} 
              onClick={() => navigate(`/gallery/${project.id}`)}
              className={`relative group overflow-hidden aspect-video cursor-pointer ${
                index === ARCHIVE_PROJECTS.length - 1 && ARCHIVE_PROJECTS.length % 2 !== 0 ? 'md:col-span-2' : ''
              }`}
            >
              <img 
                src={getOptimizedUrl(project.image)} 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 brightness-50 group-hover:brightness-100 transition-all duration-700" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-12 bg-black/20 group-hover:bg-transparent transition-colors duration-500">
                <p className="text-[11px] font-bold tracking-[0.1em] opacity-60 mb-2">{project.subtitle}</p>
                <h3 className="text-2xl md:text-4xl font-display font-bold mb-4 group-hover:scale-110 transition-transform duration-500">{project.title}</h3>
                <button 
                  className="px-8 py-3 bg-brand-red text-white text-[10px] font-bold uppercase tracking-widest border border-brand-red hover:bg-brand-dark hover:text-white hover:border-white transition-all duration-300 shadow-lg"
                >
                  Learn More
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Featured = () => {
  const shuffledItems = useMemo(() => {
    return [...FEATURED_ITEMS].sort(() => Math.random() - 0.5);
  }, []);

  return (
    <section id="featured" className="py-16 md:py-24 lg:py-32 bg-[#0A0A0A] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-10 md:mb-16 text-center">
        <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 tracking-tighter">Work & Life</h2>
        <div className="w-12 h-[1px] bg-brand-red mx-auto" />
      </div>
      
      <div className="relative flex overflow-hidden">
        <div 
          className="flex gap-8 whitespace-nowrap animate-infinite-scroll"
        >
          {[...shuffledItems, ...shuffledItems].map((item, index) => (
            <motion.div 
              key={`${item.id}-${index}`} 
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="parchment-card p-1 shadow-2xl group w-[300px] md:w-[400px] shrink-0 cursor-pointer"
            >
              <div className="bg-white p-4 h-full flex flex-col whitespace-normal">
                <div className="aspect-[4/5] overflow-hidden mb-6">
                  <img 
                    src={getOptimizedUrl(item.image)} 
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" 
                    referrerPolicy="no-referrer" 
                  />
                </div>
                <div className="text-center flex-grow flex flex-col justify-center">
                  <h4 className="text-xl font-display font-bold mb-1 tracking-tight">{item.title}</h4>
                  <div className="text-[10px] font-bold tracking-[0.4em] opacity-40 mt-4">
                    {item.time}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Newsletter = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', phone: '', message: '' });
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert(error instanceof Error ? error.message : 'Something went wrong. Please try again later.');
      setStatus('idle');
    }
  };

  return (
    <section id="contact" className="py-16 md:py-24 lg:py-32 border-t border-white/5">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 max-w-xs md:max-w-none mx-auto leading-tight">If I'm not available, please leave your contact details.</h2>
          <div className="w-12 h-[1px] bg-brand-red mx-auto" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="relative group">
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Name *" 
                className="w-full bg-transparent border-b border-white/20 py-4 px-2 outline-none focus:border-brand-red transition-colors text-sm placeholder:text-white/20"
              />
            </div>
            <div className="relative group">
              <input 
                required
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email *" 
                className="w-full bg-transparent border-b border-white/20 py-4 px-2 outline-none focus:border-brand-red transition-colors text-sm placeholder:text-white/20"
              />
            </div>
          </div>

          <div className="relative group">
            <input 
              type="tel" 
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Phone (Optional)" 
              className="w-full bg-transparent border-b border-white/20 py-4 px-2 outline-none focus:border-brand-red transition-colors text-sm placeholder:text-white/20"
            />
          </div>

          <div className="relative group">
            <textarea 
              maxLength={200}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Message (Optional, max 200 characters)" 
              rows={4}
              className="w-full bg-transparent border-b border-white/20 py-4 px-2 outline-none focus:border-brand-red transition-colors text-sm placeholder:text-white/20 resize-none"
            />
            <div className="absolute right-2 bottom-2 text-[10px] font-bold tracking-widest opacity-30">
              {formData.message.length} / 200
            </div>
          </div>

          <div className="text-center pt-8">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={status !== 'idle'}
              className="px-16 py-4 bg-brand-red text-white font-bold uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed border-none outline-none focus:ring-0"
            >
              {status === 'idle' ? 'SUBMIT' : status === 'submitting' ? 'SENDING...' : 'SUCCESS!'}
            </motion.button>
            <p className="mt-8 text-[10px] text-white/30 tracking-widest text-center">
              Your information is confidential. I’ll respond as soon as possible.
            </p>
          </div>
        </form>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="py-24 bg-brand-dark border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-1">
            <div className="flex flex-col items-start">
              <img 
                src={getOptimizedUrl("https://github.com/David007-CN/DW/blob/main/David%20Signature/David%20Signature%20red%20bold.png?raw=true")}
                alt="David Signature"
                className="h-16 md:h-20 w-auto object-contain mb-6"
                referrerPolicy="no-referrer"
              />
              <div className="flex gap-6 pl-1">
                <Twitter size={20} className="opacity-40 hover:opacity-100 cursor-pointer transition-opacity" />
                <Facebook size={20} className="opacity-40 hover:opacity-100 cursor-pointer transition-opacity" />
                <Instagram size={20} className="opacity-40 hover:opacity-100 cursor-pointer transition-opacity" />
                <Youtube size={20} className="opacity-40 hover:opacity-100 cursor-pointer transition-opacity" />
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="text-[10px] font-bold tracking-widest opacity-30 mb-6">Legal</h5>
            <ul className="space-y-3 text-xs opacity-60">
              <li className="hover:text-brand-red cursor-pointer">Terms of Service</li>
              <li className="hover:text-brand-red cursor-pointer">Privacy</li>
              <li className="hover:text-brand-red cursor-pointer">Imprint</li>
            </ul>
          </div>
          
          <div>
            <h5 className="text-[10px] font-bold tracking-widest opacity-30 mb-6">Press</h5>
            <ul className="space-y-3 text-xs opacity-60">
              <li className="hover:text-brand-red cursor-pointer">Code of Conduct</li>
              <li className="hover:text-brand-red cursor-pointer">Media Assets</li>
            </ul>
          </div>
          
          <div>
            <h5 className="text-[10px] font-bold tracking-widest opacity-30 mb-6">Data policy</h5>
            <ul className="space-y-3 text-xs opacity-60">
              <li className="hover:text-brand-red cursor-pointer">Partners</li>
              <li className="hover:text-brand-red cursor-pointer">Cookie Settings</li>
            </ul>
          </div>
        </div>
        
        <div className="text-center pt-12 border-t border-white/5">
          <p className="text-[10px] opacity-30 tracking-[0.3em]">
            © 2026 Vanguard design gmbh. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

const GalleryPage = () => {
  const { id } = useParams<{ id: string }>();
  const project = ARCHIVE_PROJECTS.find(p => p.id === Number(id)) || ARCHIVE_PROJECTS[0];
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  return (
    <div className="min-h-screen bg-brand-dark pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <Link to="/" className="text-brand-red flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:text-white transition-colors mb-8">
              <ChevronLeft size={16} /> Back to Home
            </Link>
            <h1 className="text-4xl md:text-7xl font-display font-bold mb-6">{project.title}</h1>
            <p className="text-white/40 text-lg mb-8 max-w-2xl italic">{project.subtitle}</p>
            <div className="w-24 h-[1px] bg-brand-red" />
          </div>

          <div className="flex flex-wrap gap-3">
            {ARCHIVE_PROJECTS.filter(p => p.id !== project.id).map((otherProject) => (
              <Link 
                key={otherProject.id}
                to={`/gallery/${otherProject.id}`}
                className="px-4 py-2 border border-white/10 bg-white/5 text-[10px] font-bold tracking-widest hover:border-brand-red hover:text-brand-red transition-all duration-300"
              >
                {otherProject.title}
              </Link>
            ))}
          </div>
        </div>

        <div className={project.title === "Video" ? "space-y-16" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"}>
          {(project.galleryImages || []).map((item, i) => {
            const isObject = typeof item === 'object';
            const videoUrl = isObject ? item.url : item;
            const imageUrl = project.title === "Video" 
              ? getVideoThumbnail(videoUrl, isObject ? item.cover : undefined)
              : (isObject ? item.cover : item);

            return (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group cursor-pointer"
                onClick={() => setSelectedImage(videoUrl)}
              >
                <div className="relative aspect-video overflow-hidden bg-white/5 border border-white/10 p-1 mb-4">
                  <img 
                    src={getOptimizedUrl(imageUrl)} 
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  {(project.title === "Video" || videoUrl.includes('bilibili.com') || videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-brand-red/90 flex items-center justify-center text-white shadow-2xl transform group-hover:scale-110 transition-transform duration-500">
                        <Play size={32} fill="currentColor" className="ml-1" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className={`${project.title === "Video" ? "text-base font-bold" : "text-[13px] font-medium text-white/60"} font-display mb-1`}>
                      {isObject && item.title ? item.title : `${project.category} ${project.title === "Video" ? "Production" : "Case Study"} ${i + 1}`}
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-white/20 tracking-widest">{i + 1}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12"
            onClick={() => setSelectedImage(null)}
          >
            <button 
              className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors z-[110]"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
            >
              <X size={32} />
            </button>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-7xl w-full aspect-video shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedImage.includes('bilibili.com') || selectedImage.includes('player.bilibili.com') ? (
                <iframe 
                  src={
                    selectedImage.includes('player.bilibili.com') 
                      ? selectedImage 
                      : `//player.bilibili.com/player.html?bvid=${selectedImage.match(/BV[a-zA-Z0-9]+/)?.[0]}&page=1&high_quality=1&autoplay=0`
                  }
                  className="w-full h-full border-none"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              ) : selectedImage.includes('youtube.com') || selectedImage.includes('youtu.be') ? (
                <iframe 
                  src={`https://www.youtube.com/embed/${
                    selectedImage.includes('youtu.be') 
                      ? selectedImage.split('/').pop()?.split('?')[0] 
                      : selectedImage.match(/[?&]v=([^&#]+)/)?.[1]
                  }`}
                  className="w-full h-full border-none"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              ) : (
                <img 
                  src={getOptimizedUrl(selectedImage)} 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const HomePage = () => (
  <main>
    <Hero />
    <FeatureSection />
    <ExperienceAndServices />
    <Spotlight />
    <Archive />
    <Featured />
    <Newsletter />
  </main>
);

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-brand-dark selection:bg-brand-red selection:text-white custom-scrollbar">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/gallery/:id" element={<GalleryPage />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
