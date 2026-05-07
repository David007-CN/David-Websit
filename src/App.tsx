/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
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
  RotateCcw,
  RefreshCw,
  ArrowUpRight,
  ArrowRight
} from 'lucide-react';
import { Project } from './types';
import { PROJECTS } from './data/projects';

// --- Utilities ---
const GITHUB_USER = "David007-CN";
const GITHUB_REPO = "DW";
const GITHUB_REF = "main";
const GITHUB_FOLDER = "Life";

// Detection for mobile performance
const isMobile = typeof window !== 'undefined' ? /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768 : false;

const getOptimizedUrl = (url: string, width?: number, height?: number, avoidProxy?: boolean) => {
  if (!url) return url;
  
  const cleanUrl = url.split('?')[0].split('#')[0];
  const isVideo = cleanUrl.toLowerCase().match(/\.(mp4|webm|ogg|mov|m4v)$/);
  
  let rawUrl = url;
  
  // Handle GitHub URLs - convert to raw content reliably
  if (url.includes('github.com') || url.includes('raw.githubusercontent.com')) {
    if (url.includes('raw.githubusercontent.com') && url.includes('?')) return url;

    rawUrl = url.replace('github.com', 'raw.githubusercontent.com')
                .replace('/blob/', '/')
                .replace('/refs/heads/', '/');
    
    if (!url.includes('raw.githubusercontent.com')) {
      rawUrl = rawUrl.split('?')[0];
    }
  }

  // Use wsrv.nl proxy for images to compress (WebP) and resize
  if (rawUrl.startsWith('http') && !isVideo && !avoidProxy && !rawUrl.includes('youtube.com') && !rawUrl.includes('youtu.be')) {
    if (!rawUrl) return '';
    // Skip optimization for local assets or already optimized ones
    if (!rawUrl.startsWith('http') || rawUrl.includes('placeholder')) return rawUrl;

    const mWidth = isMobile ? Math.min(width || 800, 800) : width;
    const mHeight = isMobile ? Math.min(height || 800, 800) : height;
    
    // Always use original URL for cross-origin reliability if optimized fails
    const finalQuality = isMobile ? 70 : (mWidth && mWidth >= 1080 ? 92 : 85);
    
    let wsrvUrl = `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}&af&il&q=${finalQuality}&output=webp`;
    if (mWidth) wsrvUrl += `&w=${mWidth}`;
    if (mHeight) wsrvUrl += `&h=${mHeight}`;
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
      : url.includes('shorts/')
        ? url.split('shorts/')[1].split('?')[0]
        : new URLSearchParams(new URL(url).search).get('v');
    if (id) return `https://wsrv.nl/?url=https://img.youtube.com/vi/${id}/maxresdefault.jpg&af&il&w=800&h=450`;
  }
  
  const placeholder = manualCover || "https://picsum.photos/seed/video/1920/1080";
  return `https://wsrv.nl/?url=${encodeURIComponent(placeholder)}&af&il&w=800&h=450`;
};

const formatTitle = (fileName: string) => {
  if (!fileName) return "";
  // 提取文件名（不含路径和扩展名）
  let name = fileName.split('/').pop() || fileName;
  name = name.split('?')[0].replace(/\.[^/.]+$/, "");
  
  const testName = name.toLowerCase();

  // 1. 精确匹配表 (优先级最高)
  const mapping: { [key: string]: string } = {
    "nra_202604_dsc_8238": "NRA Show Exhibition",
    "nra_202604_dsc_8239": "Outdoor Shooting",
    "nra_202604_dsc_8240": "Product Detail",
    "osight_se_adjust_brightness": "Osight SE Adjust Brightness",
    "osight_se_carry": "Osight SE Carry",
    "osight_se_concealed_carry": "Osight SE Concealed Carry",
    "xinjiang": "Xinjiang Travel"
  };

  // 检查是否在映射表中（忽略大小写和下划线/空格差异）
  const normalizedKey = name.toLowerCase().replace(/[ -]/g, '_');
  for (const key in mapping) {
    if (normalizedKey.includes(key)) return mapping[key];
  }

  // 2. 如果文件名已经是很清晰的标题（含空格且无 DSC/年份字样），直接返回
  if (name.includes(' ') && !name.match(/DSC_\d+/i) && !name.match(/20\d{2}/)) {
    return name;
  }

  // 3. 通用处理逻辑
  let title = name;
  
  // 移除年份标记（如 _202601）
  title = title.replace(/_?20\d{2,4}(\d{2})?/, '');
  // 移除相机编号（如 DSC_8238）
  title = title.replace(/_?DSC_\d+/i, '');
  // 替换分隔符
  title = title.replace(/[_-]/g, ' ').trim();

  // 4. 品牌/型号词提取与修正
  const words = title.split(' ');
  const formattedWords = words.map(word => {
    const upper = word.toUpperCase();
    // 强制大写的缩写
    if (upper === 'NRA') return 'NRA Show';
    if (upper === 'XINJIANG') return 'Xinjiang Travel';
    if (['SE', 'XR', 'AI', 'GN'].includes(upper)) return upper;
    // 品牌词
    if (upper === 'OSIGHT') return 'Osight';
    // 首字母大写
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  title = formattedWords.join(' ');

  return title || "Project Asset";
};

// --- Navbar ---
const VideoPlayer = ({ url, fallbackImage, autoPlay = true, loop = true, muted = true, preload = "none" }: { 
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
    if (videoRef.current) {
      if (videoRef.current.readyState >= 2) {
        handleReady();
      }
      videoRef.current.muted = true;
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current.setAttribute('webkit-playsinline', 'true');
      videoRef.current.setAttribute('x5-playsinline', 'true');
      videoRef.current.setAttribute('x5-video-player-type', 'h5');
      videoRef.current.controls = false;
      videoRef.current.oncontextmenu = (e) => e.preventDefault();
      
      videoRef.current.play().catch(() => {});
    }
  }, [url]);

  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  const youTubeId = isYouTube ? (
    url.includes('youtu.be') 
      ? url.split('/').pop()?.split('?')[0] 
      : url.includes('shorts/')
        ? url.split('shorts/')[1].split('?')[0]
        : new URLSearchParams(new URL(url).search).get('v')
  ) : '';

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none bg-black overflow-hidden select-none">
      <img
        src={fallbackImage}
        alt=""
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 z-0 ${isReady ? 'opacity-0' : 'opacity-100'}`}
        referrerPolicy="no-referrer"
      />
      
      {!isYouTube ? (
        <video
          key={url}
          ref={videoRef}
          src={url}
          poster={fallbackImage}
          autoPlay={autoPlay}
          muted={true}
          loop={loop}
          playsInline
          disablePictureInPicture
          controlsList="nodownload"
          preload={preload}
          onLoadedData={handleReady}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 z-10 pointer-events-none`}
          style={{ opacity: isReady ? 1 : 0 }}
        />
      ) : (
        <iframe
          src={`https://www.youtube.com/embed/${youTubeId}?autoplay=1&mute=1&loop=1&playlist=${youTubeId}&controls=0&modestbranding=1&iv_load_policy=3&enablejsapi=1`}
          className={`absolute inset-0 w-full h-full border-none transition-opacity duration-1000 z-10 ${isReady ? 'opacity-100' : 'opacity-0'}`}
          onLoad={handleReady}
          allow="autoplay; encrypted-media"
          title="Background Video"
        ></iframe>
      )}
    </div>
  );
};

// --- Experience Data ---
const EXPERIENCE = [
  {
    year: "2024.12 - Present",
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
  { id: 104, title: "NRA Show", category: "Life", image: "https://github.com/David007-CN/DW/blob/main/Life/NRA_202604_DSC_8197.JPG?raw=true", time: "2 0 2 6 . 0 4" },
  { id: 105, title: "Osight SE", category: "Life", image: "https://raw.githubusercontent.com/David007-CN/DW/302b80babe660745f95431389997b321af1c495b/Life/Osight%20SE_202604.jpg", time: "2 0 2 6 . 0 4" },
  { id: 106, title: "Osight XR", category: "Life", image: "https://raw.githubusercontent.com/David007-CN/DW/302b80babe660745f95431389997b321af1c495b/Life/Osight%20XR_202601.jpg", time: "2 0 2 6 . 0 1" },
  { id: 107, title: "NRA Show", category: "Life", image: "https://github.com/David007-CN/DW/blob/main/Life/NRA_202604_DSC_8238.JPG?raw=true", time: "2 0 2 6 . 0 4" },
  { id: 108, title: "NRA Show", category: "Life", image: "https://github.com/David007-CN/DW/blob/main/Life/NRA_202604_DSC_8303.JPG?raw=true", time: "2 0 2 6 . 0 4" },
  { id: 109, title: "Xinjiang Travel", category: "Life", image: "https://github.com/David007-CN/DW/blob/main/Life/Xinjiang-13_202501.jpg?raw=true", time: "2 0 2 5 . 0 1" },
  { id: 110, title: "NRA Show", category: "Life", image: "https://github.com/David007-CN/DW/blob/main/Life/NRA_202604_DSC_8307.JPG?raw=true", time: "2 0 2 6 . 0 4" },
  { id: 111, title: "Xinjiang Travel", category: "Life", image: "https://github.com/David007-CN/DW/blob/main/Life/Xinjiang-14_202501.jpg?raw=true", time: "2 0 2 5 . 0 1" },
  { id: 112, title: "Xinjiang Travel", category: "Life", image: "https://github.com/David007-CN/DW/blob/main/Life/Xinjiang-15_202501.jpg?raw=true", time: "2 0 2 5 . 0 1" },
  { id: 113, title: "NRA Show", category: "Life", image: "https://github.com/David007-CN/DW/blob/main/Life/NRA_202604_DSC_8389.JPG?raw=true", time: "2 0 2 6 . 0 4" },
  { id: 114, title: "NRA Show", category: "Life", image: "https://github.com/David007-CN/DW/blob/main/Life/NRA_202604_DSC_8390.JPG?raw=true", time: "2 0 2 6 . 0 4" },
  { id: 115, title: "Xinjiang Travel", category: "Life", image: "https://github.com/David007-CN/DW/blob/main/Life/Xinjiang-1_202501.jpg?raw=true", time: "2 0 2 5 . 0 1" },
  { id: 116, title: "Xinjiang Travel", category: "Life", image: "https://github.com/David007-CN/DW/blob/main/Life/Xinjiang-3_202501.jpg?raw=true", time: "2 0 2 5 . 0 1" },
  { id: 117, title: "Xinjiang Travel", category: "Life", image: "https://github.com/David007-CN/DW/blob/main/Life/Xinjiang-4_202501.jpg?raw=true", time: "2 0 2 5 . 0 1" },
];

// --- Components ---

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'About Me', href: '#about' },
    { name: 'Portfolio', href: '#works' },
    { name: 'Services', href: '#contact' },
  ];

  return (
    <div className="fixed top-0 left-0 w-full z-50">
      <nav className={`w-full transition-all duration-300 relative z-10 bg-brand-dark border-b border-white/5 ${scrolled ? 'py-1' : 'py-2'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex justify-between items-center">
          <div className="flex items-center gap-6 lg:gap-12">
            <button 
              onClick={() => {
                if (isHomePage) {
                  document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' });
                } else {
                  navigate('/');
                  // 使用更高可靠性的滚动重置
                  window.requestAnimationFrame(() => {
                    window.scrollTo(0, 0);
                    // 强制恢复 body 滚动，防止某些弹窗组件导致的卡死
                    document.body.style.overflow = 'auto';
                    document.documentElement.style.overflow = 'auto';
                  });
                }
              }}
              className="flex items-center"
            >
              <motion.img 
                whileHover={{ scale: 1.05 }}
                src={getOptimizedUrl("https://github.com/David007-CN/DW/blob/main/David%20Signature/David%20Signature%20red%20bold.png?raw=true")}
                alt="David Signature"
                className="h-10 md:h-12 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </button>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-4 lg:gap-8">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => {
                    if (isHomePage) {
                      const id = link.href.replace('#', '');
                      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      navigate('/');
                      setTimeout(() => {
                        const id = link.href.replace('#', '');
                        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                      }, 200);
                    }
                  }}
                  className="text-[14px] lg:text-[15px] font-bold text-white/70 hover:text-white transition-colors tracking-wide whitespace-nowrap"
                >
                  {link.name}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 lg:gap-4">
            <button 
              onClick={() => {
                if (isHomePage) {
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                } else {
                  navigate('/');
                  setTimeout(() => {
                    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }
              }}
              className="w-32 lg:w-40 h-[38px] lg:h-[42px] bg-brand-red text-white text-[13px] lg:text-[15px] font-bold tracking-normal hover:bg-white hover:text-brand-dark transition-all duration-300 text-center flex items-center justify-center pointer-events-auto"
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
                <button
                  key={link.name}
                  onClick={() => {
                    setIsOpen(false);
                    if (isHomePage) {
                      const id = link.href.replace('#', '');
                      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      navigate('/');
                      setTimeout(() => {
                        const id = link.href.replace('#', '');
                        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }
                  }}
                  className="text-2xl font-display font-bold hover:text-brand-red transition-colors text-left"
                >
                  {link.name}
                </button>
              ))}
              <div className="mt-8 pt-8 border-t border-white/10">
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    if (isHomePage) {
                      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      navigate('/');
                      setTimeout(() => {
                        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }
                  }}
                  className="w-full px-8 py-4 bg-brand-red text-white text-[15px] font-bold tracking-normal shadow-lg shadow-brand-red/20 active:scale-[0.98] transition-all"
                >
                  Contact Me
                </button>
              </div>
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
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => document.getElementById('works')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-48 md:w-40 lg:w-48 py-2 md:py-2 lg:py-2.5 border border-white/20 bg-white/5 backdrop-blur-sm text-white font-bold tracking-normal text-sm md:text-xs lg:text-base transition-all"
              >
                Learn More
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-48 md:w-40 lg:w-48 py-2 md:py-2 lg:py-2.5 bg-brand-red text-white font-bold tracking-normal text-sm md:text-xs lg:text-base transition-all"
              >
                Contact Now
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
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIndex((prev) => (prev + 1) % PROJECTS.length);
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
              <span className="text-[12px] font-bold tracking-normal opacity-60">Rotate</span>
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

const Archive = ({ archiveProjects }: { archiveProjects: Project[] }) => {
  const navigate = useNavigate();
  const [activeTouchId, setActiveTouchId] = useState<number | null>(null);
  
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
          {archiveProjects.map((project, index) => (
            <div 
              key={project.id} 
              onClick={() => navigate('/gallery/' + project.id)}
              onTouchStart={() => setActiveTouchId(project.id)}
              onTouchEnd={() => setActiveTouchId(null)}
              onTouchCancel={() => setActiveTouchId(null)}
              className={`relative group overflow-hidden aspect-video cursor-pointer bg-white/5 ${
                index === archiveProjects.length - 1 && archiveProjects.length % 2 !== 0 ? 'md:col-span-2' : ''
              }`}
            >
              {project.category === 'Video' ? (
                <div 
                  className={`absolute inset-0 w-full h-full ${activeTouchId === project.id ? 'grayscale-0 brightness-100' : 'grayscale group-hover:grayscale-0 brightness-[0.7] group-hover:brightness-100'} transition-all duration-1000 overflow-hidden pointer-events-none bg-black`}
                >
                    <VideoPlayer 
                      url={project.videoUrl || `https://www.youtube.com/watch?v=${project.backgroundVideoId}`}
                      fallbackImage={getOptimizedUrl(project.image, 800, 450)}
                      preload={isMobile ? "none" : "auto"}
                    />
                  {/* 叠加遮罩层 */}
                  <div className={`absolute inset-0 ${activeTouchId === project.id ? 'bg-black/10' : 'bg-black/50 group-hover:bg-black/10'} transition-colors duration-1000`} />
                </div>
              ) : (
                <img 
                  src={getOptimizedUrl(project.image, window.innerWidth > 768 ? 1200 : 800, window.innerWidth > 768 ? 675 : 450)} 
                  className={`w-full h-full object-cover ${activeTouchId === project.id ? 'grayscale-0 brightness-100' : 'grayscale group-hover:grayscale-0 brightness-[0.45] group-hover:brightness-100'} transition-all duration-700`} 
                  referrerPolicy="no-referrer"
                  loading={index < 2 ? "eager" : "lazy"}
                  fetchPriority={index < 2 ? "high" : "auto"}
                />
              )}
              <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-12 bg-black/25 group-hover:bg-transparent transition-colors duration-500">
                <p className="text-[11px] font-bold tracking-[0.1em] opacity-60 mb-2">{project.subtitle}</p>
                <h3 className="text-2xl md:text-4xl font-display font-bold mb-4 group-hover:scale-110 transition-transform duration-500">{project.title}</h3>
                <div className="flex flex-col items-center">
                  <button 
                    className="px-4 md:px-6 lg:px-10 py-1 md:py-1.5 lg:py-2 bg-brand-red text-white text-[11px] md:text-[13px] lg:text-[15px] font-bold tracking-normal border border-brand-red hover:bg-brand-dark hover:text-white hover:border-white transition-all duration-300 shadow-lg"
                  >
                    Learn More
                  </button>
                </div>
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
  const [shuffleVersion, setShuffleVersion] = useState(0);

  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  const shuffledItems = useMemo(() => {
    return featuredItems;
  }, [featuredItems]);

  // 当列表长度发生变化或强制手动刷新时，重置滚动位置
  useEffect(() => {
    x.set(0);
  }, [shuffledItems.length, x]);

  const displayItems = useMemo(() => {
    if (shuffledItems.length === 0) return [];
    // 增加更高的重复次数，确保哪怕在 8K 或多屏宽屏上也能平稳循环
    const repeatCount = 12; 
    const items = [];
    for (let i = 0; i < repeatCount; i++) {
        items.push(...shuffledItems);
    }
    return items;
  }, [shuffledItems]);

  useAnimationFrame(() => {
    if (isHovered || isDragging || selectedIndex !== null || isLoading) return;
    
    // 降低一点速度，PC 端更稳健
    let currentX = x.get() - 0.7; 
    if (containerRef.current) {
      const scrollWidth = containerRef.current.scrollWidth;
      const count = shuffledItems.length;
      if (count === 0) return;
      
      const itemWidth = scrollWidth / (displayItems.length / count);
      
      if (currentX <= -itemWidth) {
        currentX += itemWidth;
      }
    }
    x.set(currentX);
  });

  // Handle wrapping during drag
  useEffect(() => {
    const unsub = x.on('change', (v) => {
      if (containerRef.current) {
        const scrollWidth = containerRef.current.scrollWidth;
        const count = shuffledItems.length;
        if (count === 0) return;
        const itemWidth = scrollWidth / (displayItems.length / count);
        
        if (v <= -itemWidth) {
          x.set(v + itemWidth);
        } else if (v > 0) {
          x.set(v - itemWidth);
        }
      }
    });
    return unsub;
  }, [shuffledItems, displayItems.length, x]);

  const processFiles = (data: any[]) => {
    if (!Array.isArray(data)) return false;
    
    const githubItems: Project[] = data
      .filter((file: any) => 
        file.type === 'file' && 
        ['jpg', 'jpeg', 'png', 'gif', 'webp'].some(ext => file.name.toLowerCase().endsWith('.' + ext))
      )
      .map((file: any, index: number) => {
        const name = file.name; // Keep original name for URL
        const title = formatTitle(name);
        
        let time = "2 0 2 5";
        const dateMatch = name.match(/20(\d{2,4})/);
        if (dateMatch) {
           const dateStr = dateMatch[0].length === 4 ? dateMatch[0] : `20${dateMatch[1]}`;
           time = dateStr.split('').map((char, i) => i === 3 ? char + ' . ' : char).join(' ');
        }

        // Use jsDelivr as primary mirror for stability, fallback to Statically then Raw
        const jsdelivrUrl = `https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${GITHUB_REF}/${GITHUB_FOLDER}/${file.name}`;
        const staticallyUrl = `https://cdn.statically.io/gh/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_REF}/${GITHUB_FOLDER}/${file.name}`;
        const rawUrl = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_REF}/${GITHUB_FOLDER}/${encodeURIComponent(file.name)}`;

        return {
          id: 2000 + index,
          title: title, 
          category: "Life",
          image: jsdelivrUrl, // Try jsDelivr first
          fallbackImage: staticallyUrl,
          time: time,
          altImages: [jsdelivrUrl, staticallyUrl, rawUrl]
        } as Project & { altImages: string[] };
      });

    if (githubItems.length > 0) {
      // 深度随机打乱
      const shuffled = [...githubItems];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      setFeaturedItems(shuffled.slice(0, 48)); 
      setShuffleVersion(v => v + 1);
      return true;
    }
    return false;
  };

  const fetchGitHubImages = async (isManual = false) => {
    if (isManual) {
      setIsLoading(true);
      // Keep existing items until fetch completes for a smooth transition
      localStorage.removeItem(`github_images_cache_${GITHUB_REF}`);
    }

    // 先检查缓存 (非手动模式)
    if (!isManual) {
      const cached = localStorage.getItem(`github_images_cache_${GITHUB_REF}`);
      if (cached) {
        try {
          const parsedCache = JSON.parse(cached);
          if (Array.isArray(parsedCache)) {
             if (processFiles(parsedCache)) {
               setIsLoading(false);
               return;
             }
          }
        } catch (e) { }
      }
    }

    const controllers = {
      direct: `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${GITHUB_FOLDER}?ref=${GITHUB_REF}&nocache=${Date.now()}`,
      proxy: `/api/github-proxy?owner=${GITHUB_USER}&repo=${GITHUB_REPO}&path=${GITHUB_FOLDER}&ref=${GITHUB_REF}&t=${Date.now()}`
    };

    // 优先尝试从 API 获取最新数据
    try {
      const response = await fetch(controllers.direct);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          localStorage.setItem(`github_images_cache_${GITHUB_REF}`, JSON.stringify(data));
          if (processFiles(data)) {
            setIsLoading(false);
            return;
          }
        }
      }
    } catch (e) {
      console.warn("Direct fetch skipped or failed, trying proxy...");
    }

    try {
      const response = await fetch(controllers.proxy);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          localStorage.setItem(`github_images_cache_${GITHUB_REF}`, JSON.stringify(data));
          processFiles(data);
        }
      }
    } catch (err) {
      console.error("All fetch attempts failed");
    } finally {
      setIsLoading(false);
      // Fallback if fetch failed
      setFeaturedItems(prev => {
        if (prev.length === 0) return FEATURED_ITEMS;
        if (isManual) {
          // Re-shuffle existing items locally if shuffle was requested but fetch failed
          const shuffled = [...prev];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          return shuffled;
        }
        return prev;
      });
      if (isManual) setShuffleVersion(v => v + 1);
    }
  };

  useEffect(() => {
    fetchGitHubImages();
  }, []);

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
    <section id="work-life-section" className="py-16 md:py-24 lg:py-32 bg-[#0A0A0A] overflow-hidden relative min-h-[500px]">
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
            dragElastic={0.1}
            dragConstraints={{ left: -Infinity, right: Infinity }}
            dragTransition={{ power: 0.2, timeConstant: 200 }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
            className="flex gap-8 whitespace-nowrap cursor-grab active:cursor-grabbing touch-pan-y"
          >
            {displayItems.map((item, index) => (
              <motion.div 
                key={item.id + "-" + index + "-" + shuffleVersion} 
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
                      src={getOptimizedUrl(item.image, window.innerWidth > 768 ? 1000 : 800)} 
                      draggable={false}
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 select-none" 
                      referrerPolicy="no-referrer" 
                      crossOrigin="anonymous"
                      loading={index < 3 ? "eager" : "lazy"}
                      fetchPriority={index < 3 ? "high" : "auto"}
                      style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const altImages = (item as any).altImages || [];
                        const currentIdx = parseInt(target.dataset.altIdx || "-1");
                        const nextIdx = currentIdx + 1;
                        
                        if (nextIdx < altImages.length) {
                          target.dataset.altIdx = nextIdx.toString();
                          target.src = getOptimizedUrl(altImages[nextIdx], window.innerWidth > 768 ? 1000 : 800);
                        } else {
                          // Final fallback
                          target.src = `https://picsum.photos/seed/${item.id}/800/800`;
                        }
                      }}
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

      {shuffledItems.length >= 0 && (
        <div className="mt-16 text-center">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fetchGitHubImages(true)}
            className="inline-flex items-center px-10 py-3 bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 rounded-full transition-all duration-300 font-display text-base tracking-normal group"
          >
            <div className="relative mr-3">
              <RefreshCw className={`w-5 h-5 transition-transform duration-700 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
            </div>
            {isLoading ? 'Shuffling...' : 'Shuffle Random Batch'}
          </motion.button>
          <p className="mt-4 text-[12px] text-white/20 tracking-[0.2em] font-light">
            Click to explore other moments from the archive
          </p>
        </div>
      )}

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
              className="px-20 py-2.5 bg-brand-red text-white font-bold tracking-normal text-base disabled:opacity-50 disabled:cursor-not-allowed border-none outline-none focus:ring-0"
            >
              {status === 'idle' ? 'Submit' : status === 'submitting' ? 'Sending...' : 'Success!'}
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
        <div className="flex flex-col md:flex-row md:items-center gap-12 md:gap-16 lg:gap-24 mb-20">
          <div className="flex flex-col items-start shrink-0">
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
          
          <div className="md:pt-0">
            <p className="font-handwriting text-2xl md:text-3xl text-brand-red leading-tight">
              Focused on product launch and conversion design. Built to perform, not just to impress.
            </p>
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

const GalleryPage = ({ archiveProjects }: { archiveProjects: Project[] }) => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project>(() => 
    archiveProjects.find(p => p.id === Number(id)) || archiveProjects[0]
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronize state with URL changes
  useEffect(() => {
    const freshProject = archiveProjects.find(p => p.id === Number(id)) || archiveProjects[0];
    setProject(freshProject);
    setSelectedIndex(null);
    setError(null);
  }, [id, archiveProjects]);

  const galleryItems = project.galleryImages || [];

  useEffect(() => {
    if (!project || project.title === 'Video') return;
    
    // Reset loading state and gallery if id changes significantly
    setProject(prev => {
      if (prev.id !== Number(id)) {
        return { ...prev, galleryImages: archiveProjects.find(p => p.id === Number(id))?.galleryImages || [] };
      }
      return prev;
    });

      const fetchGalleryContent = async () => {
      // 1. First check if we already have it in localStorage to avoid API calls
      const cacheKey = `github_gallery_${project.title}_${project.id}`;
      
      // Force clear cache for Retouching to ensure fresh state as requested
      if (project.title === 'Retouching') {
        localStorage.removeItem(cacheKey);
      }
      
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        try {
          const { data, timestamp } = JSON.parse(cachedData);
          const isExpired = Date.now() - timestamp > 1000 * 60 * 60; // 1 hour expiration
          
          if (!isExpired && data && data.length > 0) {
            setProject(prev => prev ? ({ ...prev, galleryImages: data }) : null);
            return;
          }
        } catch (e) {
          localStorage.removeItem(cacheKey);
        }
      }

      // Avoid refetching if already loaded in current state (unless it's Retouching)
      if (galleryItems.length > 5 && project.title !== 'Retouching') return;

      setIsLoading(true);
      setError(null);
      
      const config = CATEGORY_CONFIGS[project.title] || { folder: project.title, ref: undefined };
      const folderName = config.folder;
      const ref = config.ref || GITHUB_REF;
      
      const apiPath = `/api/github-proxy?owner=${GITHUB_USER}&repo=${GITHUB_REPO}&path=${encodeURIComponent(folderName)}&ref=${ref}&t=${Date.now()}`;
      
      try {
        let response = await fetch(apiPath);
        
        if (response.ok) {
          try {
            const data = await response.json();
            console.log(`Gallery fetch success for ${project.title}:`, data.length, "items");
            const dynamicGallery: any[] = [];
            
            if (Array.isArray(data)) {
              // Process root items
              for (const item of data) {
                if (item.type === 'file' && item.name.toLowerCase().match(/\.(jpg|jpeg|png|webp|mp4|mov|webm)$/i)) {
                  const rawUrl = item.download_url || `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${ref}/${item.path}`;
                  dynamicGallery.push({
                    url: rawUrl,
                    cover: item.name.toLowerCase().match(/\.(mp4|mov|webm)$/) ? rawUrl.replace(/\.(mp4|mov|webm)$/i, '.jpg') : rawUrl,
                    title: item.name.replace(/\.[^/.]+$/, "")
                  });
                } else if (item.type === 'dir') {
                  // For subdirectories, fetch their contents too
                  const subPath = item.path;
                  const subApi = `/api/github-proxy?owner=${GITHUB_USER}&repo=${GITHUB_REPO}&path=${encodeURIComponent(subPath)}&ref=${ref}&t=${Date.now()}`;
                  try {
                    const subRes = await fetch(subApi);
                    if (subRes.ok) {
                      const subItems = await subRes.json();
                      if (Array.isArray(subItems)) {
                        subItems.forEach((subItem: any) => {
                          if (subItem.type === 'file' && subItem.name.toLowerCase().match(/\.(jpg|jpeg|png|webp|mp4|mov|webm)$/i)) {
                            const rawUrl = subItem.download_url || `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${ref}/${subItem.path}`;
                            dynamicGallery.push({
                              url: rawUrl,
                              cover: subItem.name.toLowerCase().match(/\.(mp4|mov|webm)$/) ? rawUrl.replace(/\.(mp4|mov|webm)$/i, '.jpg') : rawUrl,
                              title: subItem.name.replace(/\.[^/.]+$/, ""),
                              group: item.name // Keep track of parent folder name
                            });
                          }
                        });
                      }
                    }
                  } catch (e) {
                    console.error(`Failed to fetch subfolder ${subPath}:`, e);
                  }
                }
              }
            
              // Set gallery state
              setProject(prev => prev ? ({ ...prev, galleryImages: dynamicGallery }) : null);
              
              if (dynamicGallery.length > 0) {
                // Cache the result
                localStorage.setItem(cacheKey, JSON.stringify({
                  data: dynamicGallery,
                  timestamp: Date.now()
                }));
              } else {
                localStorage.removeItem(cacheKey);
                setError("No images found in this folder or its subfolders.");
              }
            }
          } catch (jsonErr) {
            console.error("Gallery JSON Parsing Error:", jsonErr);
            setError("The response from GitHub source was invalid.");
          }
        } else {
          // ... error handling ...
          if (response.status === 404) {
            setProject(prev => prev ? ({ ...prev, galleryImages: [] }) : null);
            localStorage.removeItem(cacheKey);
            setError(`Folder '${folderName}' not found in the repository.`);
          } else {
            setError(`GitHub API Error: ${response.status}`);
          }
        }
      } catch (err) {
        console.error("Gallery Fetch Error:", err);
        setError("Failed to connect to GitHub.");
      } finally {
        setIsLoading(false);
      }
    };


    fetchGalleryContent();
  }, [project.title, project.id]);

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
  }, [selectedIndex, galleryItems.length]);

  const selectedItem = selectedIndex !== null ? galleryItems[selectedIndex] : null;
  const selectedUrl = selectedItem ? (typeof selectedItem === 'object' ? selectedItem.url : selectedItem) : null;

  return (
    <div className="min-h-screen bg-brand-dark pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <Link to="/" className="text-brand-red flex items-center gap-2 text-base font-bold tracking-normal hover:text-white transition-colors mb-8">
              <ChevronLeft size={16} /> Back to Home
            </Link>
            <h1 className="text-4xl md:text-7xl font-display font-bold mb-6">{project.title}</h1>
            <p className="text-white/40 text-lg mb-8 max-w-2xl italic">{project.subtitle}</p>
            <div className="w-24 h-[1px] bg-brand-red" />
          </div>

          <div className="flex flex-wrap gap-3">
            {archiveProjects.filter(p => p.id !== project.id).map((otherProject) => (
              <Link 
                key={otherProject.id}
                to={'/gallery/' + otherProject.id}
                className="px-4 py-2 border border-white/10 bg-white/5 text-[10px] font-bold tracking-normal hover:border-brand-red hover:text-brand-red transition-all duration-300"
              >
                {otherProject.title}
              </Link>
            ))}
          </div>
        </div>

        <div className={project.title === "Video" ? "space-y-16" : ""}>
          {isLoading && galleryItems.length === 0 ? (
            <div className="py-24 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-white/20 text-[10px] font-bold tracking-widest">Connecting to GitHub Source...</p>
            </div>
          ) : galleryItems.length === 0 ? (
            <div className="py-48 text-center border-y border-white/5 bg-white/[0.01]">
              <p className="text-white/40 text-[13px] italic font-display tracking-wide">No images found in this folder.</p>
            </div>
          ) : (
            (() => {
              const isRetouching = project.title === "Retouching";
              const isVideo = project.title === "Video";

              // 检查是否有分组（文件夹）
              const hasGroups = galleryItems.some(item => typeof item === 'object' && 'group' in item);

              // 如果不是 Retouching 且没有分组，使用最简单的渲染逻辑，确保样式和顺序完全恢复
              if (!isRetouching && !hasGroups) {
                return (
                  <div className={isVideo ? "space-y-16" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 mb-16"}>
                    {galleryItems.map((item, i) => {
                      const isObject = typeof item === 'object';
                      const videoUrl = isObject ? item.url : item;
                      const imageUrl = isVideo 
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
                          <div className={`relative ${isVideo ? "aspect-video" : "min-h-[200px] h-auto"} overflow-hidden bg-white/5 border border-white/10 p-1 mb-3`}>
                            <img 
                              src={getOptimizedUrl(imageUrl, isVideo ? 1600 : 1200)} 
                              className={`w-full ${isVideo ? "h-full object-cover" : "h-auto object-contain"} transition-all duration-700 group-hover:scale-105`}
                              referrerPolicy="no-referrer"
                              loading="lazy"
                            />
                            {(isVideo || videoUrl.includes('bilibili.com') || videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') || videoUrl.match(/\.(mp4|mov|webm)$/i)) && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-brand-red/90 flex items-center justify-center text-white shadow-2xl transform group-hover:scale-110 transition-transform duration-500">
                                  <Play size={20} fill="currentColor" className="ml-1" />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex justify-between items-start gap-2">
                            <h3 className={`${isVideo || (isObject && item.title) ? "text-base font-bold" : "text-[12px] font-medium text-white/50"} font-display leading-tight flex-grow`}>
                              {isObject && item.title ? item.title : formatTitle(videoUrl)}
                            </h3>
                            <span className="text-[9px] font-bold text-white/10 tracking-widest shrink-0 mt-0.5">{i + 1}</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                );
              }

              // 对于 Retouching 或有分组的页面，执行分组逻辑
              const groups: Record<string, any[]> = {};
              const rootItems: any[] = [];
              const groupOrder: string[] = [];
              
              galleryItems.forEach(item => {
                if (typeof item === 'object' && 'group' in item && item.group) {
                  const g = item.group as string;
                  if (!groups[g]) {
                    groups[g] = [];
                    groupOrder.push(g);
                  }
                  groups[g].push(item);
                } else {
                  rootItems.push(item);
                }
              });

              // 仅在 Retouching 时反转文件夹和根项目顺序
              if (isRetouching) {
                if (groupOrder.length === 0 && rootItems.length === 0) {
                  console.warn("Retouching: No items found to sort.");
                }
                groupOrder.reverse();
                rootItems.reverse();
              }

              const renderGrid = (items: any[], startIndex: number) => (
                <div className={isVideo ? "space-y-16 mb-24" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 mb-16"}>
                  {items.map((item, i) => {
                    const globalIndex = startIndex + i;
                    const isObject = typeof item === 'object';
                    const videoUrl = isObject ? item.url : item;
                    const imageUrl = isVideo 
                      ? getVideoThumbnail(videoUrl, isObject ? item.cover : undefined)
                      : (isObject ? item.cover : item);

                    return (
                      <motion.div 
                        key={globalIndex}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                        className="group cursor-pointer"
                        onClick={() => setSelectedIndex(globalIndex)}
                      >
                        <div className={`relative ${isVideo ? "aspect-video" : isRetouching ? "aspect-square" : "min-h-[200px] h-auto"} overflow-hidden bg-white/5 border border-white/10 p-1 mb-3`}>
                          <img 
                            src={getOptimizedUrl(imageUrl, isVideo || isRetouching ? 1600 : 1200)} 
                            className={`w-full ${isVideo || isRetouching ? "h-full object-cover" : "h-auto object-contain"} transition-all duration-700 group-hover:scale-105`}
                            referrerPolicy="no-referrer"
                            loading="lazy"
                          />
                          {(isVideo || videoUrl.includes('bilibili.com') || videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') || videoUrl.match(/\.(mp4|mov|webm)$/i)) && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full bg-brand-red/90 flex items-center justify-center text-white shadow-2xl transform group-hover:scale-110 transition-transform duration-500">
                                <Play size={20} fill="currentColor" className="ml-1" />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-between items-start gap-2">
                          <h3 className={`${isVideo || (isObject && item.title) ? "text-base font-bold" : "text-[12px] font-medium text-white/50"} font-display leading-tight flex-grow`}>
                            {isObject && item.title ? item.title : formatTitle(videoUrl)}
                          </h3>
                          <span className="text-[9px] font-bold text-white/10 tracking-widest shrink-0 mt-0.5">{globalIndex + 1}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              );

              let currentIndex = 0;
              const resultArr = [];

              if (rootItems.length > 0) {
                resultArr.push(<div key="root-grid">{renderGrid(rootItems, currentIndex)}</div>);
                currentIndex += rootItems.length;
              }

              groupOrder.forEach((groupName) => {
                const items = groups[groupName];
                resultArr.push(
                  <div key={groupName} className="mb-24">
                    <div className="flex items-center gap-6 mb-10">
                      <h2 className="text-2xl md:text-3xl font-display font-bold text-white whitespace-nowrap">{groupName}</h2>
                      <div className="h-[1px] bg-white/20 flex-grow" />
                    </div>
                    {renderGrid(items, currentIndex)}
                  </div>
                );
                currentIndex += items.length;
              });

              return resultArr;
            })()
          )}
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
              className={`relative shadow-2xl flex items-center justify-center overflow-hidden bg-black ${
                selectedUrl.includes('bilibili.com') || (selectedUrl.includes('youtube.com') && !selectedUrl.includes('shorts/')) || selectedUrl.includes('youtu.be')
                  ? "w-full max-w-[95vw] max-h-[90vh] aspect-video" 
                : selectedUrl.includes('shorts/')
                  ? "max-h-[85vh] aspect-[9/16] w-auto max-w-[95vw]"
                : selectedUrl.match(/\.(mp4|mov|webm)$/i)
                  ? "max-w-[100vw] max-h-[100vh] w-auto h-auto"
                : project.title === "Retouching"
                  ? "w-full max-w-[min(90vw,1000px)] aspect-square"
                : "max-w-[min(95vw,1920px)] max-h-[min(90vh,1080px)] w-auto h-auto"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {selectedUrl.includes('bilibili.com') || selectedUrl.includes('player.bilibili.com') ? (
                <div className="w-full h-full aspect-video">
                  <iframe 
                    src={
                      selectedUrl.includes('player.bilibili.com') 
                        ? selectedUrl 
                        : 'https://player.bilibili.com/player.html?bvid=' + (selectedUrl.includes('BV') ? 'BV' + selectedUrl.split('BV')[1].split(/[?&/]/)[0] : '') + '&page=1&high_quality=1&autoplay=1'
                    }
                    className="w-full h-full border-none"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              ) : selectedUrl.includes('youtube.com') || selectedUrl.includes('youtu.be') ? (
                <div className={`w-full h-full ${selectedUrl.includes('shorts/') ? 'aspect-[9/16]' : 'aspect-video'}`}>
                  <iframe 
                    src={'https://www.youtube.com/embed/' + (
                      selectedUrl.includes('youtu.be') 
                        ? selectedUrl.split('/').pop()?.split('?')[0] 
                        : selectedUrl.includes('shorts/')
                          ? selectedUrl.split('shorts/')[1].split('?')[0]
                          : (selectedUrl.includes('v=') ? selectedUrl.split('v=')[1].split('&')[0] : '')
                    ) + '?autoplay=1'}
                    className="w-full h-full border-none"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              ) : selectedUrl.match(/\.(mp4|mov|webm)$/i) ? (
                <video 
                  src={selectedUrl}
                  controls
                  autoPlay
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <img 
                  src={getOptimizedUrl(selectedUrl, 1920, 1080, true)} 
                  className={`max-w-full max-h-full ${project.title === "Retouching" || (typeof galleryItems[selectedIndex] === 'object' && (galleryItems[selectedIndex] as any).group) ? "w-full h-full object-cover" : "object-contain"} pointer-events-none`}
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

const HomePage = ({ archiveProjects }: { archiveProjects: Project[] }) => (
  <main>
    <Hero />
    <FeatureSection />
    <ExperienceAndServices />
    <Spotlight />
    <Archive archiveProjects={archiveProjects} />
    <div className="h-16 md:h-24 bg-[#0A0A0A]" aria-hidden="true" />
    <Featured />
    <Newsletter />
  </main>
);

const cleanFileNameToTitle = (filename: string) => {
  // Remove extension
  return filename.replace(/\.[^/.]+$/, "");
};

const CATEGORY_CONFIGS: Record<string, { folder: string, ref?: string }> = {
  "Design": { folder: "Expertise Showcase" },
  "Photography": { folder: "Photography" },
  "Retouching": { folder: "Retouching" },
  "Rendering": { folder: "Rendering" },
  "AI Studio": { folder: "AI Studio" },
  "Video": { folder: "Video" }
};

const INITIAL_ARCHIVE: Project[] = [
  {
    id: 1,
    title: "Design",
    subtitle: "Not decoration. Problem solving.",
    category: "Design",
    image: "https://picsum.photos/seed/design/1280/720",
    galleryImages: [
      { url: "https://raw.githubusercontent.com/David007-CN/DW/main/Expertise%20Showcase/04_Osight%20C%20launch%20banner_1920x1080.jpg", cover: "https://raw.githubusercontent.com/David007-CN/DW/main/Expertise%20Showcase/04_Osight%20C%20launch%20banner_1920x1080.jpg", title: "Osight C Launch Banner" },
      { url: "https://raw.githubusercontent.com/David007-CN/DW/main/Expertise%20Showcase/01_Osight%20SE%206MOA%20GN%20launch%20banner_1920x1080.jpg", cover: "https://raw.githubusercontent.com/David007-CN/DW/main/Expertise%20Showcase/01_Osight%20SE%206MOA%20GN%20launch%20banner_1920x1080.jpg", title: "Osight SE Launch Banner" },
      { url: "https://raw.githubusercontent.com/David007-CN/DW/main/Expertise%20Showcase/06_Osight%20C%20Teaser_1920x1080.jpg", cover: "https://raw.githubusercontent.com/David007-CN/DW/main/Expertise%20Showcase/06_Osight%20C%20Teaser_1920x1080.jpg", title: "Osight C Teaser" },
      { url: "https://raw.githubusercontent.com/David007-CN/DW/main/Expertise%20Showcase/03_C%20and%20K%20Teaser_1920x1080.jpg", cover: "https://raw.githubusercontent.com/David007-CN/DW/main/Expertise%20Showcase/03_C%20and%20K%20Teaser_1920x1080.jpg", title: "C and K Teaser" },
      { url: "https://raw.githubusercontent.com/David007-CN/DW/main/Expertise%20Showcase/02_SE%20GN%206%20MOA%20Trial%20sales_1920x1080.jpg", cover: "https://raw.githubusercontent.com/David007-CN/DW/main/Expertise%20Showcase/02_SE%20GN%206%20MOA%20Trial%20sales_1920x1080.jpg", title: "SE GN Trial Sales" },
      { url: "https://raw.githubusercontent.com/David007-CN/DW/main/Expertise%20Showcase/05_Osight%20C%20launch%20banner_1920x1080.jpg", cover: "https://raw.githubusercontent.com/David007-CN/DW/main/Expertise%20Showcase/05_Osight%20C%20launch%20banner_1920x1080.jpg", title: "Osight C Banner Without Gun" },
      { url: "https://raw.githubusercontent.com/David007-CN/DW/main/Expertise%20Showcase/07_Osight%20C%20GN%20launch%20banner_1920x1080.jpg", cover: "https://raw.githubusercontent.com/David007-CN/DW/main/Expertise%20Showcase/07_Osight%20C%20GN%20launch%20banner_1920x1080.jpg", title: "Osight C GN Launch Banner" },
      { url: "https://raw.githubusercontent.com/David007-CN/DW/main/Expertise%20Showcase/08_XR%20banner10_1200x628_AZ.jpg", cover: "https://raw.githubusercontent.com/David007-CN/DW/main/Expertise%20Showcase/08_XR%20banner10_1200x628_AZ.jpg", title: "XR Ads Banner" },
      { url: "https://raw.githubusercontent.com/David007-CN/DW/main/Expertise%20Showcase/09_C%20GN%20banner2_1200x628_SN.jpg", cover: "https://raw.githubusercontent.com/David007-CN/DW/main/Expertise%20Showcase/09_C%20GN%20banner2_1200x628_SN.jpg", title: "C GN Ads Banner" },
      { url: "https://raw.githubusercontent.com/David007-CN/DW/main/Expertise%20Showcase/10_Osight%20SE%206MOA%20GN%20launch%20banner_1920x1080.jpg", cover: "https://raw.githubusercontent.com/David007-CN/DW/main/Expertise%20Showcase/10_Osight%20SE%206MOA%20GN%20launch%20banner_1920x1080.jpg", title: "Osight SE 6MOA GN alternative banner" },
      { url: "https://raw.githubusercontent.com/David007-CN/DW/main/Expertise%20Showcase/11_Osight%20SE%206MOA%20GN%20launch%20banner_1920x1080.jpg", cover: "https://raw.githubusercontent.com/David007-CN/DW/main/Expertise%20Showcase/11_Osight%20SE%206MOA%20GN%20launch%20banner_1920x1080.jpg", title: "Osight SE 6MOA GN banner without gun" },
      { url: "https://raw.githubusercontent.com/David007-CN/DW/main/Expertise%20Showcase/12_Osight%20SE%206MOA%20GN%20launch%20banner_1920x1080.jpg", cover: "https://raw.githubusercontent.com/David007-CN/DW/main/Expertise%20Showcase/12_Osight%20SE%206MOA%20GN%20launch%20banner_1920x1080.jpg", title: "Osight SE 6MOA GN alternative banner without gun" },
    ]
  },
  {
    id: 2,
    title: "Photography",
    subtitle: "More than images.",
    category: "Photography",
    image: "https://raw.githubusercontent.com/David007-CN/DW/main/Cover/01_fly.jpg",
    galleryImages: []
  },
  {
    id: 3,
    title: "Retouching",
    subtitle: "Nothing left unnoticed.",
    category: "Retouching",
    image: "https://github.com/David007-CN/DW/blob/main/Cover/SE%20White%20background_2.jpg?raw=true",
    galleryImages: []
  },
  {
    id: 4,
    title: "Rendering",
    subtitle: "Visualized in detail.",
    category: "Rendering",
    image: "https://github.com/David007-CN/DW/blob/main/Cover/Scene%20and%20White%20model_2560x1440.jpg?raw=true",
    galleryImages: []
  },
  {
    id: 5,
    title: "AI Studio",
    subtitle: "Where ideas take form.",
    category: "AI Studio",
    image: "https://github.com/David007-CN/DW/blob/main/Cover/Retro%20pistol_2560x1440.jpg?raw=true",
    galleryImages: []
  },
  {
    id: 6,
    title: "Video",
    subtitle: "Primarily 3rd-party production, with our concept guidance.",
    category: "Video",
    backgroundVideoId: "Ix7uaO1QJA4",
    videoUrl: "https://raw.githubusercontent.com/David007-CN/DW/main/Cover/bg-video-4s.mp4",
    image: "https://raw.githubusercontent.com/David007-CN/DW/main/Cover/bg-video-4s.jpg",
    galleryImages: [
      { 
        url: "https://youtu.be/bLBBiNbUMQ4", 
        title: "Osight X GN — Charge Fast. See Clear. Strike True. ⚡🟢"
      },
      { 
        url: "https://youtu.be/A_TdfLXRKCQ", 
        title: "We Made OSIGHT SE Green Again"
      },
       { 
        url: "https://www.bilibili.com/video/BV1oNkTBnErQ?t=79.5", 
        cover: "https://raw.githubusercontent.com/David007-CN/DW/main/Cover/03_DSC06797.jpg",
        title: "【双板新手入门】第二课 犁式刹车和拐弯！"
      },
      { 
        url: "https://www.youtube.com/shorts/6mLs_SSOnh4?feature=share", 
        title: "Day 1 of NRA Houston!"
      },
    ]
  }
];

// --- Scroll To Top Helper ---
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  
  useEffect(() => {
    if (!hash) {
      // 使用更底层的覆盖方式
      const forceTop = () => {
        window.scrollTo(0, 0);
        document.body.scrollTo(0, 0);
        if (document.scrollingElement) {
          document.scrollingElement.scrollTop = 0;
        }
      };
      
      forceTop();
      requestAnimationFrame(forceTop);
      const t = setTimeout(forceTop, 30);
      return () => clearTimeout(t);
    }
  }, [pathname, hash]);
  
  return null;
};

// 强制在全局范围禁用滚动恢复，防止刷新时跳回底部
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

export default function App() {
  const location = useLocation();

  // 核心修复：刷新时强制回顶并开启滚动能力
  useLayoutEffect(() => {
    // 禁用浏览器自动滚动恢复
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const forceReset = () => {
      // 暴力回顶
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      
      // 彻底解锁滚动能力
      const styles = {
        overflow: 'auto',
        height: 'auto',
        minHeight: '100vh',
        position: 'static',
        touchAction: 'auto'
      };
      
      Object.assign(document.body.style, styles);
      Object.assign(document.documentElement.style, styles);
      
      // 特殊情况：如果是苹果设备或某些特定的容器导致的卡死
      document.body.classList.remove('overflow-hidden', 'fixed');
    };

    forceReset();
    // 多次确认，防止异步组件（如 Archive）渲染导致的位置偏移
    const timers = [10, 100, 300, 700].map(ms => setTimeout(forceReset, ms));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="min-h-screen bg-brand-dark selection:bg-brand-red selection:text-white custom-scrollbar">
      <ScrollToTop />
      <Navbar />
      <Routes location={location}>
        <Route path="/" element={<HomePage archiveProjects={INITIAL_ARCHIVE} />} />
        <Route path="/gallery/:id" element={<GalleryPage archiveProjects={INITIAL_ARCHIVE} />} />
      </Routes>
      <Footer />
    </div>
  );
}
