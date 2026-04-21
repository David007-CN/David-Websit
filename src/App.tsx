/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useAnimationFrame } from 'motion/react';
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
  ChevronDown,
  Eye,
  Maximize,
  RotateCcw
} from 'lucide-react';
import { Project } from './types';
import { PROJECTS } from './data/projects';

// --- Utilities ---
const getOptimizedUrl = (url: string, width?: number, height?: number, avoidProxy?: boolean) => {
  if (!url) return url;
  
  const cleanUrl = url.split('?')[0].split('#')[0];
  const isVideo = cleanUrl.toLowerCase().match(/\.(mp4|webm|ogg|mov|m4v)$/);
  
  let rawUrl = url;
  
  // Handle GitHub URLs - convert to raw content reliably
  if (url.includes('github.com') || url.includes('raw.githubusercontent.com')) {
    rawUrl = url.replace('github.com', 'raw.githubusercontent.com')
                .replace('/blob/', '/')
                .replace('/refs/heads/', '/');
    rawUrl = rawUrl.split('?')[0];
  }

  // Use wsrv.nl proxy for images to compress (WebP) and resize
  // We re-enable this for speed, but ensures the URL is cleanly encoded
  if (rawUrl.startsWith('http') && !isVideo && !avoidProxy && !rawUrl.includes('youtube.com') && !rawUrl.includes('youtu.be')) {
    // Balanced optimization: higher quality for visual excellence
    const isSmall = width && width < 600;
    const isHighRes = width && width >= 1080;
    const quality = isSmall ? 80 : (isHighRes ? 92 : 85);
    let wsrvUrl = `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}&af&il&q=${quality}`;
    if (width) wsrvUrl += `&w=${width}`;
    if (height) wsrvUrl += `&h=${height}`;
    return wsrvUrl;
  }

  return rawUrl;
};

const getVideoThumbnail = (url: string, manualCover?: string) => {
  if (manualCover && !manualCover.includes('img.bilibili.com') && !manualCover.includes('picsum.photos/seed/video')) {
    return getOptimizedUrl(manualCover, 800, 450);
  }
  
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const id = url.includes('youtu.be') 
      ? url.split('/').pop()?.split('?')[0] 
      : new URLSearchParams(new URL(url).search).get('v');
    if (id) return `https://wsrv.nl/?url=https://img.youtube.com/vi/${id}/maxresdefault.jpg&af&il&w=800&h=450`;
  }
  
  const placeholder = manualCover || "https://picsum.photos/seed/video/1920/1080";
  return `https://wsrv.nl/?url=${encodeURIComponent(placeholder)}&af&il&w=800&h=450`;
};

// --- Video Player ---
const VideoPlayer = ({ url, fallbackImage, autoPlay = true, loop = true, muted = true, preload = "metadata" }: { 
  url: string, 
  fallbackImage: string,
  autoPlay?: boolean,
  loop?: boolean,
  muted?: boolean,
  preload?: "none" | "metadata" | "auto"
}) => {
  const [isReady, setIsReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleReady = () => {
    if (!isReady) {
      setIsReady(true);
    }
  };

  useEffect(() => {
    if (videoRef.current && videoRef.current.readyState >= 2) {
      handleReady();
    }
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none bg-black overflow-hidden">
      {/* 始终显示封面图作为占位，直到视频准备就绪 */}
      <img
        src={fallbackImage}
        alt="Video thumbnail"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 z-0 ${isReady ? 'opacity-0' : 'opacity-100'}`}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      
      {!url.includes('youtube.com') && !url.includes('youtu.be') ? (
        <video
          key={url}
          ref={videoRef}
          src={url}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          playsInline
          preload={preload}
          crossOrigin="anonymous"
          onLoadedData={handleReady}
          onCanPlay={handleReady}
          onPlaying={handleReady}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 z-10 ${isReady ? 'opacity-100' : 'opacity-0'}`}
        />
      ) : (
        /* YouTube Embed */
        <iframe
          src={`https://www.youtube.com/embed/${url.includes('youtu.be') ? url.split('/').pop() : new URLSearchParams(new URL(url).search).get('v')}?autoplay=1&mute=1&loop=1&playlist=${url.includes('youtu.be') ? url.split('/').pop() : new URLSearchParams(new URL(url).search).get('v')}&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&enablejsapi=1`}
          className={`absolute inset-0 w-full h-full border-none transition-opacity duration-1000 z-10 ${isReady ? 'opacity-100' : 'opacity-0'}`}
          onLoad={handleReady}
          allow="autoplay; encrypted-media"
          title="Background Video"
        ></iframe>
      )}
    </div>
  );
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
      { url: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/07_Osight%20C%20GN%20launch%20banner_1920x1080.jpg?raw=true", cover: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/07_Osight%20C%20GN%20launch%20banner_1920x1080.jpg?raw=true", title: "Osight C GN Launch Banner" },
      { url: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/08_XR%20banner10_1200x628_AZ.jpg?raw=true", cover: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/08_XR%20banner10_1200x628_AZ.jpg?raw=true", title: "XR Ads Banner" },
      { url: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/09_C%20GN%20banner2_1200x628_SN.jpg?raw=true", cover: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/09_C%20GN%20banner2_1200x628_SN.jpg?raw=true", title: "C GN Ads Banner" },
      { url: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/10_Osight%20SE%206MOA%20GN%20launch%20banner_1920x1080.jpg?raw=true", cover: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/10_Osight%20SE%206MOA%20GN%20launch%20banner_1920x1080.jpg?raw=true", title: "Osight SE 6MOA GN alternative banner" },
      { url: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/11_Osight%20SE%206MOA%20GN%20launch%20banner_1920x1080.jpg?raw=true", cover: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/11_Osight%20SE%206MOA%20GN%20launch%20banner_1920x1080.jpg?raw=true", title: "Osight SE 6MOA GN banner without gun" },
      { url: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/12_Osight%20SE%206MOA%20GN%20launch%20banner_1920x1080.jpg?raw=true", cover: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/12_Osight%20SE%206MOA%20GN%20launch%20banner_1920x1080.jpg?raw=true", title: "Osight SE 6MOA GN alternative banner without gun" },
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
    title: "Rendering",
    subtitle: "Visualized in detail.",
    category: "Rendering",
    image: "https://picsum.photos/seed/render/1280/720",
    galleryImages: [
      { url: "https://picsum.photos/seed/render-1/1920/1080", cover: "https://picsum.photos/seed/render-1/1920/1080", title: "Rendering Project 1" },
      { url: "https://picsum.photos/seed/render-2/1920/1080", cover: "https://picsum.photos/seed/render-2/1920/1080", title: "Rendering Project 2" },
      { url: "https://picsum.photos/seed/render-3/1920/1080", cover: "https://picsum.photos/seed/render-3/1920/1080", title: "Rendering Project 3" },
      { url: "https://picsum.photos/seed/render-4/1920/1080", cover: "https://picsum.photos/seed/render-4/1920/1080", title: "Rendering Project 4" },
    ]
  },
  {
    id: 5,
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
    id: 6,
    title: "Video",
    subtitle: "Primarily 3rd-party production, with our concept guidance.",
    category: "Video",
    backgroundVideoId: "Ix7uaO1QJA4",
    videoUrl: "https://github.com/David007-CN/DW/blob/560162b86408fbde325757658adc0082962ac679/Cover/bg-video-4s.mp4",
    image: "https://github.com/David007-CN/DW/blob/560162b86408fbde325757658adc0082962ac679/Cover/bg-video-4s.jpg",
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
        cover: "https://github.com/David007-CN/DW/blob/main/Cover/03_DSC06797.jpg?raw=true",
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
    title: "Product Launch Visual Design",
    description: "Responsible for end-to-end visual design for product launches, including pre-launch assets, key visuals, product pages, and advertising materials, delivering consistent visuals that build product awareness, increase exposure, and drive conversions.",
    icon: <Palette size={24} />,
    iconUrl: "https://github.com/David007-CN/DW/blob/main/Icons/1.png?raw=true" // You can put your image URL here, e.g., "https://example.com/icon.png"
  },
  {
    title: "E-commerce & Campaign Design",
    description: "Providing visual support for campaigns across independent websites and platforms like Amazon, covering promotional pages, key visuals, and ad creatives, ensuring platform compliance while improving click-through rates and conversion performance.",
    icon: <Layout size={24} />,
    iconUrl: "https://github.com/David007-CN/DW/blob/main/Icons/2.png?raw=true"
  },
  {
    title: "B2B Branding & Event Materials",
    description: "Designing digital and print materials for B2B communication, including brand assets, product catalogs, and event visuals for trade shows and product launches, helping brands present professionally across touchpoints and support business conversions.",
    icon: <Zap size={24} />,
    iconUrl: "https://github.com/David007-CN/DW/blob/main/Icons/3.png?raw=true&v=4"
  }
];

const FEATURED_ITEMS: Project[] = [
  { id: 101, title: "Osight SE Adjust Brightness", category: "Life", image: "https://raw.githubusercontent.com/David007-CN/DW/302b80babe660745f95431389997b321af1c495b/Life/Osight%20SE%20Adjust%20Brightness_202601.jpg", time: "2 0 2 6 . 0 1" },
  { id: 102, title: "Osight SE Carry", category: "Life", image: "https://raw.githubusercontent.com/David007-CN/DW/302b80babe660745f95431389997b321af1c495b/Life/Osight%20SE%20Carry_202601.jpg", time: "2 0 2 6 . 0 1" },
  { id: 103, title: "Osight SE Concealed Carry", category: "Life", image: "https://raw.githubusercontent.com/David007-CN/DW/302b80babe660745f95431389997b321af1c495b/Life/Osight%20SE%20Concealed%20Carry_202601.jpg", time: "2 0 2 6 . 0 1" },
  { id: 104, title: "NRA Show Exhibition", category: "Life", image: "https://raw.githubusercontent.com/David007-CN/DW/302b80babe660745f95431389997b321af1c495b/Life/NRA_202604_DSC_8238.jpg", time: "2 0 2 6 . 0 4" },
  { id: 105, title: "Osight SE", category: "Life", image: "https://raw.githubusercontent.com/David007-CN/DW/302b80babe660745f95431389997b321af1c495b/Life/Osight%20SE_202604.jpg", time: "2 0 2 6 . 0 4" },
  { id: 106, title: "Osight XR", category: "Life", image: "https://raw.githubusercontent.com/David007-CN/DW/302b80babe660745f95431389997b321af1c495b/Life/Osight%20XR_202601.jpg", time: "2 0 2 6 . 0 1" },
  { id: 107, title: "Outdoor Shooting", category: "Life", image: "https://raw.githubusercontent.com/David007-CN/DW/302b80babe660745f95431389997b321af1c495b/Life/NRA_202604_DSC_8239.jpg", time: "2 0 2 6 . 0 4" },
  { id: 108, title: "Product Detail", category: "Life", image: "https://raw.githubusercontent.com/David007-CN/DW/302b80babe660745f95431389997b321af1c495b/Life/NRA_202604_DSC_8240.jpg", time: "2 0 2 6 . 0 4" },
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
            <h1 className="text-3xl md:text-6xl lg:text-8xl font-display font-bold leading-tight tracking-tight mb-16 md:mb-24 lg:mb-32 flex flex-col items-center">
              <div className="relative inline-block max-w-full">
                <span>Hello, welcome</span>
                <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 md:mt-6 text-[8px] md:text-[10px] lg:text-xs font-display font-normal opacity-60 flex justify-center tracking-[0.1em] md:tracking-[0.35em] whitespace-nowrap w-[90vw] md:w-auto">
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
    <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden bg-brand-dark pt-[56px] md:pt-[64px]">
      <AnimatePresence initial={false}>
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          drag="x"
          dragDirectionLock
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.7}
          onDragEnd={(_, info) => {
            const threshold = 30;
            if (info.offset.x > threshold) handlePrev();
            else if (info.offset.x < -threshold) handleNext();
          }}
          className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing touch-pan-y"
        >
          {slides[currentSlide].type === 'content' ? (
            <>
              <div className="absolute inset-0 z-0 pointer-events-none">
                <img 
                  src={getOptimizedUrl(slides[currentSlide].bg!, window.innerWidth > 768 ? 2560 : 1080, window.innerWidth > 768 ? 1440 : 1350)} 
                  alt="Background" 
                  className="w-full h-full object-cover brightness-[0.4] contrast-110"
                  referrerPolicy="no-referrer"
                  fetchPriority="high"
                  loading="eager"
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
                src={getOptimizedUrl(slides[currentSlide].desktop!, 2560, 1440)} 
                alt={slides[currentSlide].alt}
                className="hidden md:block w-full h-full object-cover brightness-[0.8] hover:brightness-[0.9] transition-all duration-1000 pointer-events-none"
                referrerPolicy="no-referrer"
                fetchPriority="high"
                loading="eager"
              />
              <img 
                src={getOptimizedUrl(slides[currentSlide].mobile!, 1080, 1800)} 
                alt={slides[currentSlide].alt}
                className="block md:hidden w-full h-full object-cover brightness-[0.8] pointer-events-none"
                referrerPolicy="no-referrer"
                fetchPriority="high"
                loading="eager"
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
          
          <div className="flex-grow space-y-20 md:space-y-24 relative before:absolute before:left-[23px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
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
                    src={getOptimizedUrl(exp.logo, 64, 64)} 
                    alt={exp.brand} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                    loading="lazy"
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
                className="glass-card p-8 hover:border-brand-red transition-colors flex flex-col h-full"
              >
                <div className="flex items-center gap-4 mb-3 group">
                  <div className="text-brand-red shrink-0 w-8 h-8 flex items-center justify-center">
                    {service.iconUrl ? (
                      <motion.img 
                        src={getOptimizedUrl(service.iconUrl, 48, 48)} 
                        alt={service.title}
                        className="w-full h-full object-contain animate-slow-spin pause-on-hover"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    ) : (
                      <motion.div
                        className="animate-slow-spin pause-on-hover"
                      >
                        {service.icon}
                      </motion.div>
                    )}
                  </div>
                  <h3 className="text-xl font-display font-bold tracking-tight text-white">{service.title}</h3>
                </div>
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
  const [isZoomed, setIsZoomed] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);
  const [pinchStartDistance, setPinchStartDistance] = useState<number | null>(null);
  const [pinchStartScale, setPinchStartScale] = useState(1);

  const project = PROJECTS[selectedIndex % PROJECTS.length];
  const currentImage = project.image;

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIndex((prev) => (prev - 1 + PROJECTS.length) % PROJECTS.length);
    setRotation(0); // Reset rotation on slide change
    setZoomScale(1); // Reset zoom on slide change
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIndex((prev) => (prev + 1) % PROJECTS.length);
    setRotation(0); // Reset rotation on slide change
    setZoomScale(1); // Reset zoom on slide change
  };

  const toggleRotation = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRotation((prev) => (prev === 0 ? 90 : 0));
  };

  const toggleZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomScale(zoomScale > 1 ? 1 : 2.5);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      setPinchStartDistance(dist);
      setPinchStartScale(zoomScale);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDistance !== null) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      const delta = dist / pinchStartDistance;
      const newScale = Math.min(Math.max(pinchStartScale * delta, 1), 5);
      setZoomScale(newScale);
    }
  };

  const handleTouchEnd = () => {
    setPinchStartDistance(null);
  };
  
  return (
    <section id="expertise" className="relative py-16 md:py-24 lg:py-32 overflow-hidden bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-10 md:mb-16 lg:mb-20">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 max-w-md md:max-w-none mx-auto leading-tight">Selected Work</h2>
          <p className="text-white/40 text-xs md:text-sm font-medium tracking-wide mb-6">Only a selection is shown here. Browse full projects by category below.</p>
          <div className="w-24 h-[1px] bg-brand-red mx-auto" />
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-[8%] items-start">
          {/* Left Thumbnails - 20% width (Smaller to ensure height is within preview) */}
          <div className="w-full lg:w-[20%] shrink-0">
            <div className="grid grid-cols-4 lg:grid-cols-2 gap-1.5">
              {PROJECTS.map((p, i) => {
                return (
                  <div 
                    key={i} 
                    onClick={() => setSelectedIndex(i)}
                    className={`aspect-video border cursor-pointer transition-all duration-300 ${selectedIndex === i ? 'border-brand-red ring-1 ring-brand-red' : 'border-white/10 hover:border-white/40'} bg-white/5`}
                  >
                    <img 
                      src={getOptimizedUrl(p.image, window.innerWidth > 768 ? 600 : 400, window.innerWidth > 768 ? 338 : 225)} 
                      className="w-full h-full object-cover transition-all duration-500" 
                      referrerPolicy="no-referrer" 
                      loading={i < 4 ? "eager" : "lazy"}
                      fetchPriority={i < 4 ? "high" : "auto"}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Right Preview - 72% width (Larger to provide vertical containment) */}
          <div className="w-full lg:w-[72%] flex flex-col justify-start items-center lg:items-end text-center lg:text-right mt-0 lg:mt-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center lg:items-end w-full"
            >
              <div className="relative w-full group">
                {/* Desktop Navigation Arrows - Centered in the 8% gap */}
                <button 
                  onClick={handlePrev}
                  className="hidden lg:flex absolute top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/40 hover:text-white hover:border-white/40 hover:bg-white/10 transition-all duration-300 z-20"
                  style={{ left: '-6.5%' }}
                  aria-label="Previous Project"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={handleNext}
                  className="hidden lg:flex absolute top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/40 hover:text-white hover:border-white/40 hover:bg-white/10 transition-all duration-300 z-20"
                  style={{ right: '-6.5%' }}
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

                <div 
                  className="w-full aspect-video mt-14 mb-14 lg:mt-0 lg:mb-0 border border-white/10 p-1 bg-white/5 backdrop-blur-sm cursor-zoom-in group-hover:border-white/30 transition-colors overflow-hidden"
                  onClick={() => setIsZoomed(true)}
                >
                  <img 
                    src={getOptimizedUrl(currentImage, window.innerWidth > 768 ? 1280 : 800, window.innerWidth > 768 ? 720 : 450)} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    referrerPolicy="no-referrer" 
                    loading={selectedIndex === 0 ? "eager" : "lazy"}
                    fetchPriority={selectedIndex === 0 ? "high" : "auto"}
                  />
                  
                  {/* Zoom Icon Hint */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                      <Maximize size={20} />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="w-full mt-4 text-center lg:text-right">
                <h4 className="text-sm font-bold text-white/90 mb-1">{project.title}</h4>
                <p className="text-sm text-white/60 leading-relaxed italic">
                  {project.description}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>

      {/* Spotlight Lightbox */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsZoomed(false)}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-0 cursor-zoom-out"
          >
            <button 
              className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors z-[210] p-4"
              onClick={(e) => { e.stopPropagation(); setIsZoomed(false); }}
              aria-label="Close"
            >
              <X size={32} />
            </button>

            {/* Rotation Button */}
            <button 
              className="absolute top-6 left-6 text-white/60 hover:text-white transition-colors z-[210] p-4 flex flex-col items-center gap-1"
              onClick={toggleRotation}
              aria-label="Rotate"
            >
              <RotateCcw size={28} />
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Rotate</span>
            </button>

            <button 
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all z-[210]"
              onClick={handlePrev}
            >
              <ChevronLeft size={32} />
            </button>
            <button 
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all z-[210]"
              onClick={handleNext}
            >
              <ChevronRight size={32} />
            </button>
            
            <motion.div 
              key={`${selectedIndex}-${rotation}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
              }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full h-full flex items-center justify-center p-4 overflow-hidden touch-none"
              onDoubleClick={toggleZoom}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={() => {
                // If not zoomed, single click background to close
                if (zoomScale <= 1) setIsZoomed(false);
              }}
            >
              <motion.div 
                drag={zoomScale > 1}
                dragConstraints={{ left: -1500, right: 1500, top: -1500, bottom: 1500 }} // Allow free drag when zoomed
                animate={{ 
                  scale: zoomScale, 
                  rotate: rotation,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={`relative flex items-center justify-center pointer-events-auto shadow-2xl ${zoomScale > 1 ? 'cursor-move' : 'cursor-zoom-in'}`}
                style={{ 
                  width: (rotation !== 0) ? '90vh' : 'auto',
                  height: (rotation !== 0) ? '90vw' : 'auto',
                  maxWidth: (rotation !== 0 || zoomScale > 1) ? 'none' : '90vw',
                  maxHeight: (rotation !== 0 || zoomScale > 1) ? 'none' : '85vh',
                }}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image
              >
                <img 
                  src={getOptimizedUrl(currentImage, undefined, undefined, true)} 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  draggable={false}
                />
              </motion.div>
            </motion.div>

            {/* Title Overlay in Lightbox - hidden when zoomed */}
            <AnimatePresence>
              {zoomScale <= 1.1 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-10 left-0 w-full text-center px-6 pointer-events-none z-[220]"
                >
                  <h4 className="text-xl font-bold text-white mb-2">{project.title}</h4>
                  <p className="text-sm text-white/40">{project.description}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
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
              onClick={() => navigate('/gallery/' + project.id)}
              className={`relative group overflow-hidden aspect-video cursor-pointer bg-white/5 ${
                index === ARCHIVE_PROJECTS.length - 1 && ARCHIVE_PROJECTS.length % 2 !== 0 ? 'md:col-span-2' : ''
              }`}
            >
              {project.category === 'Video' ? (
                <div 
                  className="absolute inset-0 w-full h-full grayscale group-hover:grayscale-0 brightness-[0.7] group-hover:brightness-100 transition-all duration-1000 overflow-hidden pointer-events-none bg-black"
                >
                  <VideoPlayer 
                    url={getOptimizedUrl(project.videoUrl || `https://www.youtube.com/watch?v=${project.backgroundVideoId}`)}
                    fallbackImage={getOptimizedUrl(project.image, 800, 450)}
                    preload="none"
                  />
                  {/* 叠加遮罩层，默认较暗以突出文字，滑过时变透明 */}
                  <div className="absolute inset-0 bg-black/50 group-hover:bg-black/10 transition-colors duration-1000" />
                </div>
              ) : (
                <img 
                  src={getOptimizedUrl(project.image, window.innerWidth > 768 ? 1200 : 800, window.innerWidth > 768 ? 675 : 450)} 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 brightness-50 group-hover:brightness-100 transition-all duration-700" 
                  referrerPolicy="no-referrer"
                  loading={index < 2 ? "eager" : "lazy"}
                  fetchPriority={index < 2 ? "high" : "auto"}
                />
              )}
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
  const [featuredItems, setFeaturedItems] = useState<Project[]>(FEATURED_ITEMS);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  useAnimationFrame(() => {
    if (isHovered || isDragging || selectedIndex !== null || isLoading) return;
    
    let currentX = x.get() - 1; // Animation speed
    if (containerRef.current) {
      const halfWidth = containerRef.current.scrollWidth / 2;
      if (currentX <= -halfWidth) {
        currentX += halfWidth;
      }
    }
    x.set(currentX);
  });

  // Handle wrapping during drag
  useEffect(() => {
    return x.on('change', (v) => {
      if (containerRef.current) {
        const halfWidth = containerRef.current.scrollWidth / 2;
        if (v <= -halfWidth) {
          x.set(v + halfWidth);
        } else if (v > 0) {
          x.set(v - halfWidth);
        }
      }
    });
  }, [x]);

  // GitHub Folder Configuration
  const GITHUB_REPO = "David007-CN/DW";
  const GITHUB_FOLDER = "Life"; 
  const GITHUB_REF = "main"; // Track main branch for real-time updates

  useEffect(() => {
    const processFiles = (data: any[]) => {
      const githubItems: Project[] = data
        .filter((file: any) => 
          file.type === 'file' && 
          ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'].some(ext => file.name.toLowerCase().endsWith('.' + ext))
        )
        .map((file: any, index: number) => {
          const name = decodeURIComponent(file.name);
          const fileName = name.split('.')[0];
          
          // 1. Title: Everything before the FIRST underscore.
          const firstUnderscoreIndex = fileName.indexOf('_');
          let title = firstUnderscoreIndex !== -1 ? fileName.substring(0, firstUnderscoreIndex) : fileName;
          
          // 1.1 Ignore numeric suffixes like -1, -10 etc inside the title part
          title = title.replace(/-\d+$/, '');

          // 1.2 Append "Show" if title is NRA
          if (title.toUpperCase() === 'NRA') {
             title = title + " Show";
          }
          
          // 1.3 Append "Travel" if title is Xinjiang
          if (title.toUpperCase() === 'XINJIANG') {
             title = title + " Travel";
          }
          
          // 2. Time: Find 6-digit date starting with 20...
          let time = "2 0 2 5";
          const dateMatch = fileName.match(/20\d{4}/);
          if (dateMatch) {
             const dateStr = dateMatch[0];
             time = dateStr.split('').map((char, i) => i === 3 ? char + ' . ' : char).join(' ');
          }

          // Generate a more robust URL for direct access from main/ref
          const imageUrl = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_REF}/${GITHUB_FOLDER}/${file.name}`;

          return {
            id: 2000 + index,
            title: title, // Exact capitalization as in filename
            category: "Life",
            image: imageUrl,
            time: time
          };
        });

      if (githubItems.length > 0) {
        let shuffled = [...githubItems].sort(() => Math.random() - 0.5);
        const interleaved: Project[] = [];
        const pool = [...shuffled];
        
        while (pool.length > 0) {
          let foundIndex = -1;
          const len = interleaved.length;
          if (len >= 2) {
            const p1 = interleaved[len - 1].title.substring(0, 4).toLowerCase();
            const p2 = interleaved[len - 2].title.substring(0, 4).toLowerCase();
            if (p1 === p2 && p1.length >= 4) {
              foundIndex = pool.findIndex(item => item.title.substring(0, 4).toLowerCase() !== p1);
            }
          }
          if (foundIndex === -1) foundIndex = 0;
          interleaved.push(pool.splice(foundIndex, 1)[0]);
        }
        setFeaturedItems(interleaved.slice(0, 24));
        return true;
      }
      return false;
    };

    const fetchGitHubImages = async () => {
      // 1. Try to load from cache immediately to show content fast
      const cached = localStorage.getItem(`github_images_cache_${GITHUB_REF}`);
      let hasRenderedFromCache = false;
      if (cached) {
        try {
          const parsedCache = JSON.parse(cached);
          if (Array.isArray(parsedCache) && processFiles(parsedCache)) {
            hasRenderedFromCache = true;
            setIsLoading(false); // Stop spinner if we have cache
          }
        } catch (e) { /* ignore cache error */ }
      }

      if (!hasRenderedFromCache) {
        setIsLoading(true);
      }

      try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FOLDER}?ref=${GITHUB_REF}`);
        
        if (response.status === 403) {
          console.warn("GitHub API rate limited.");
          throw new Error("Rate limit");
        }

        if (!response.ok) {
          throw new Error(`GitHub API returned ${response.status}`);
        }
        
        const data = await response.json();
        if (Array.isArray(data)) {
          try {
            localStorage.setItem(`github_images_cache_${GITHUB_REF}`, JSON.stringify(data));
          } catch (e) { /* ignore */ }
          // Re-process if it's the first time OR to update background content
          processFiles(data);
        }
      } catch (err) {
        console.warn("GitHub Fetch Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGitHubImages();
  }, []);

  const shuffledItems = useMemo(() => {
    return featuredItems;
  }, [featuredItems]);

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % shuffledItems.length);
    }
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + shuffledItems.length) % shuffledItems.length);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') setSelectedIndex(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, shuffledItems.length]);

  const selectedItem = selectedIndex !== null ? shuffledItems[selectedIndex] : null;

  return (
    <section id="featured" className="py-16 md:py-24 lg:py-32 bg-[#0A0A0A] overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-6 mb-10 md:mb-16 text-center relative">
        <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 tracking-tighter text-white">Work & Life</h2>
        <div className="w-12 h-[1px] bg-brand-red mx-auto mb-6" />
      </div>
      
      <div className="relative flex overflow-hidden">
        {isLoading ? (
          <div className="flex gap-8 px-6 py-10">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-[300px] md:w-[400px] aspect-square bg-white/5 animate-pulse rounded-sm" />
            ))}
          </div>
        ) : (
          <motion.div 
            ref={containerRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ x }}
            drag="x"
            dragConstraints={{ left: -Infinity, right: Infinity }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
            className="flex gap-8 whitespace-nowrap cursor-grab active:cursor-grabbing"
          >
            {/* For mobile speed, only duplicate if screen is wide enough to need infinite loop visibility */}
            {(window.innerWidth > 768 ? [...shuffledItems, ...shuffledItems] : shuffledItems).map((item, index) => (
              <motion.div 
                key={item.id + "-" + index} 
                whileHover={{ scale: 1.02 }}
                onClick={() => {
                  if (isDragging) return;
                  const realIndex = index % shuffledItems.length;
                  setSelectedIndex(realIndex);
                }}
                className="parchment-card p-1 shadow-2xl group w-[300px] md:w-[400px] shrink-0 cursor-grab active:cursor-grabbing"
              >
                <div className="bg-white p-4 h-full flex flex-col whitespace-normal">
                  <div className="aspect-square overflow-hidden mb-6 relative bg-gray-100">
                    <img 
                      src={getOptimizedUrl(item.image, window.innerWidth > 768 ? 800 : 600, window.innerWidth > 768 ? 800 : 600)} 
                      draggable={false}
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" 
                      referrerPolicy="no-referrer" 
                      crossOrigin="anonymous"
                      loading={index < 2 ? "eager" : "lazy"}
                      fetchPriority={index < 2 ? "high" : "auto"}
                    />
                  </div>
                  <div className="text-center flex-grow flex flex-col justify-center">
                    <h4 className="text-xl font-display font-bold mb-1 tracking-tight text-brand-dark">{item.title}</h4>
                    <div className="text-[10px] font-bold tracking-[0.4em] opacity-40 mt-4 text-brand-dark">
                      {item.time}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {selectedIndex !== null && selectedItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedIndex(null)}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-0"
          >
            <button 
              className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors z-[110]"
              onClick={() => setSelectedIndex(null)}
            >
              <X size={32} />
            </button>

            <button 
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all z-[110]"
              onClick={handlePrev}
            >
              <ChevronLeft size={32} />
            </button>
            <button 
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all z-[110]"
              onClick={handleNext}
            >
              <ChevronRight size={32} />
            </button>
            
            <motion.div 
              key={selectedIndex}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                const threshold = 50;
                if (info.offset.x < -threshold || info.offset.y < -threshold) {
                  handleNext();
                } else if (info.offset.x > threshold || info.offset.y > threshold) {
                  handlePrev();
                }
              }}
              className="relative flex items-center justify-center cursor-grab active:cursor-grabbing"
            >
              <img 
                src={getOptimizedUrl(selectedItem.image, undefined, undefined, true)} 
                className="w-auto h-auto max-w-[95vw] max-h-[95vh] object-contain shadow-2xl"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
              onChange={(e) => {
                const value = e.target.value.split(/[^0-9+\-() ]/).join('');
                setFormData({ ...formData, phone: value });
              }}
              pattern="[0-9+\\\\-() ]*"
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
                <a href="https://www.instagram.com/osight_david/" target="_blank" rel="noopener noreferrer">
                  <Twitter size={20} className="opacity-40 hover:opacity-100 cursor-pointer transition-opacity" />
                </a>
                <a href="https://www.instagram.com/osight_david/" target="_blank" rel="noopener noreferrer">
                  <Facebook size={20} className="opacity-40 hover:opacity-100 cursor-pointer transition-opacity" />
                </a>
                <a href="https://www.instagram.com/osight_david/" target="_blank" rel="noopener noreferrer">
                  <Instagram size={20} className="opacity-40 hover:opacity-100 cursor-pointer transition-opacity" />
                </a>
                <a href="https://www.instagram.com/osight_david/" target="_blank" rel="noopener noreferrer">
                  <Youtube size={20} className="opacity-40 hover:opacity-100 cursor-pointer transition-opacity" />
                </a>
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
            © {new Date().getFullYear()} David Design. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

const GalleryPage = () => {
  const { id } = useParams<{ id: string }>();
  const project = ARCHIVE_PROJECTS.find(p => p.id === Number(id)) || ARCHIVE_PROJECTS[0];
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const galleryItems = project.galleryImages || [];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % galleryItems.length);
    }
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + galleryItems.length) % galleryItems.length);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') setSelectedIndex(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex]);

  const selectedItem = selectedIndex !== null ? galleryItems[selectedIndex] : null;
  const selectedUrl = selectedItem ? (typeof selectedItem === 'object' ? selectedItem.url : selectedItem) : null;

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
                to={'/gallery/' + otherProject.id}
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
                onClick={() => setSelectedIndex(i)}
              >
                <div className="relative aspect-video overflow-hidden bg-white/5 border border-white/10 p-1 mb-4">
                  <img 
                    src={getOptimizedUrl(imageUrl, 800, 450)} 
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                    loading="lazy"
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
        {selectedIndex !== null && selectedUrl && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12"
            onClick={() => setSelectedIndex(null)}
          >
            <button 
              className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors z-[110]"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex(null);
              }}
            >
              <X size={32} />
            </button>

            {/* Navigation Arrows */}
            <button 
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all z-[110]"
              onClick={handlePrev}
            >
              <ChevronLeft size={32} />
            </button>
            <button 
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all z-[110]"
              onClick={handleNext}
            >
              <ChevronRight size={32} />
            </button>

            <motion.div 
              key={selectedIndex}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                const threshold = 50;
                if (info.offset.x < -threshold || info.offset.y < -threshold) {
                  handleNext();
                } else if (info.offset.x > threshold || info.offset.y > threshold) {
                  handlePrev();
                }
              }}
              className="relative max-w-[90vw] max-h-[90vh] aspect-video shadow-2xl cursor-grab active:cursor-grabbing flex items-center justify-center"
            >
              {selectedUrl.includes('bilibili.com') || selectedUrl.includes('player.bilibili.com') ? (
                <iframe 
                  src={
                    selectedUrl.includes('player.bilibili.com') 
                      ? selectedUrl 
                      : 'https://player.bilibili.com/player.html?bvid=' + (selectedUrl.includes('BV') ? 'BV' + selectedUrl.split('BV')[1].split(/[?&/]/)[0] : '') + '&page=1&high_quality=1&autoplay=0'
                  }
                  className="w-full h-full border-none"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              ) : selectedUrl.includes('youtube.com') || selectedUrl.includes('youtu.be') ? (
                <iframe 
                  src={'https://www.youtube.com/embed/' + (
                    selectedUrl.includes('youtu.be') 
                      ? selectedUrl.split('/').pop()?.split('?')[0] 
                      : (selectedUrl.includes('v=') ? selectedUrl.split('v=')[1].split('&')[0] : '')
                  )}
                  className="w-full h-full border-none"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              ) : (
                <img 
                  src={getOptimizedUrl(selectedUrl, 1920, 1080, true)} 
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
