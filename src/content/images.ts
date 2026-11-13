// Photos for the landing page, served from public/images/. To replace one, drop a
// new file there and update its path. Empty slots show a labelled placeholder.
// Originals are kept outside the repository; these are cropped and compressed WebP.
export const images: Record<string, string | undefined> = {
  hero: '/images/hero.webp', // 918 x 1024, a customer verifying on her phone
  feature1: '/images/feature-id.webp', // 600 x 600, scanning a blank ID card
  feature2: '/images/feature-face.webp', // 600 x 600, selfie
  feature3: '/images/feature-liveness.webp', // 600 x 600, liveness check
  map: '/images/map.webp', // 1586 x 992, map of Sierra Leone
  app: '/images/app.webp', // 1000 x 1200, verification at a shop counter
  // Testimonial photos: use real customers' photos, with their permission.
  avatar1: undefined, // 160 x 160
  avatar2: undefined, // 160 x 160
  avatar3: undefined, // 160 x 160
}
