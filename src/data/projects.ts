import { Project } from '../types';

const SPECIAL_DATA: Record<number, { image: string; title: string; description: string }> = {
  0: {
    image: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/04_Osight%20C%20launch%20banner_1920x1080.jpg?raw=true",
    title: "Osight C Launch banner",
    description: "New product launch banner for the Osight C firearm-mounted version."
  },
  1: {
    image: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/01_Osight%20SE%206MOA%20GN%20launch%20banner_1920x1080.jpg?raw=true",
    title: "Osight SE 6 MOA GNLaunch banner",
    description: "Product launch banner for a new release, used across all channels for maximum reach."
  },
  2: {
    image: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/06_Osight%20C%20Teaser_1920x1080.jpg?raw=true",
    title: "Osight C Teaser banner",
    description: "A teaser banner for the Osight C, creating anticipation for the upcoming product release."
  },
  3: {
    image: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/03_C%20and%20K%20Teaser_1920x1080.jpg?raw=true",
    title: "Teaser banner",
    description: "Teaser banners for two new products, with limited product details disclosed."
  },
  4: {
    image: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/02_SE%20GN%206%20MOA%20Trial%20sales_1920x1080.jpg?raw=true",
    title: "Trial Sales",
    description: "A trial sales banner for a new product, shared only with advanced, loyal customers to gather data for product improvement."
  },
  5: {
    image: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/05_Osight%20C%20launch%20banner_1920x1080.jpg?raw=true",
    title: "Osight C Launch banner without gun",
    description: "Some platforms restrict firearm or sensitive imagery, so a non-firearm version was created for promotion."
  },
  6: {
    image: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/07_Osight%20C%20GN%20launch%20banner_1920x1080.jpg?raw=true",
    title: "Osight C GN Launch banner",
    description: "A banner for the Osight C new product featuring a firearm-in-hand version, for platforms where firearms can be displayed."
  },
  7: {
    image: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/08_XR%20banner10_1200x628_AZ.jpg?raw=true",
    title: "Osight XR Ads Banner",
    description: "A banner showcasing the new XR product during the promotional campaign."
  },
  8: {
    image: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/09_C%20GN%20banner2_1200x628_SN.jpg?raw=true",
    title: "Osight C GN Ads Banner",
    description: "A banner showcasing the new C GN product during the promotional campaign."
  },
  9: {
    image: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/10_Osight%20SE%206MOA%20GN%20launch%20banner_1920x1080.jpg?raw=true",
    title: "Osight SE 6MOA GN Banner",
    description: "Draft banner concepts for the Osight SE 6 MOA GN launch."
  },
  10: {
    image: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/11_Osight%20SE%206MOA%20GN%20launch%20banner_1920x1080.jpg?raw=true",
    title: "Osight SE 6MOA GN Banner",
    description: "Osight SE 6 MOA GN launch banner without gun."
  },
  11: {
    image: "https://github.com/David007-CN/DW/blob/main/Expertise%20Showcase/12_Osight%20SE%206MOA%20GN%20launch%20banner_1920x1080.jpg?raw=true",
    title: "Osight SE 6MOA GN Banner",
    description: "Alternative launch banner for Osight SE 6 MOA GN without gun."
  }
};

export const PROJECTS: Project[] = Array.from({ length: 12 }).map((_, i) => {
  const categories = ["Design", "Photography", "Retouching", "Ai", "Video", "Direction"];
  const category = categories[i % categories.length];
  
  return {
    id: i + 1,
    title: SPECIAL_DATA[i]?.title || `${category} Concept ${Math.floor(i / 6) + 1}`,
    subtitle: "Visual Excellence & Creative Impact",
    category: category,
    description: SPECIAL_DATA[i]?.description || `Professional ${category.toLowerCase()} services tailored for high-stakes visual impact and creative excellence in the modern digital landscape.`,
    image: SPECIAL_DATA[i]?.image || `https://picsum.photos/seed/work-${i + 1}/1280/720`
  };
});
