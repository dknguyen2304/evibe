import { HeroSection } from '@/components/Layout/hero-section';

export default function HomePage() {
  return (
    <div className='min-h-screen'>
      <HeroSection featuredMovies={[]} />
    </div>
  );
}
