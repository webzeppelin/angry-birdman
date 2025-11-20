# Angry Birdman Images

This directory contains static image assets for the Angry Birdman application.

## Mascot Logo

The Angry Birdman mascot is available in five sizes:

- `angry_birdman_logo_16.png` - 16x16px (favicon, small icons)
- `angry_birdman_logo_32.png` - 32x32px (small UI elements)
- `angry_birdman_logo_64.png` - 64x64px (medium UI elements, navigation)
- `angry_birdman_logo_128.png` - 256x256px (large UI elements, headers)
- `angry_birdman_logo_512.png` - 512x512px (hero image)

All mascot images are transparent PNG format.

## Usage in Components

To reference these images in your React components:

```tsx
// Direct path reference (recommended for public assets)
<img src="/images/angry_birdman_logo_64.png" alt="Angry Birdman" />;

// Or import from src/assets if moved there
import mascot from '../assets/angry_birdman_logo_64.png';
<img src={mascot} alt="Angry Birdman" />;
```

## Notes

- Files in the `public/` directory are served at the root path
- These images are not processed by Vite during build
- For optimal performance, use the appropriate size for your use case
