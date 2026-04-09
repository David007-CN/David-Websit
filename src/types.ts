export interface Project {
  id: number;
  title: string;
  subtitle?: string;
  category: string;
  description?: string;
  image: string;
  price?: string;
  time?: string;
  galleryImages?: (string | { url: string; cover?: string; title?: string; subtitle?: string })[];
}
