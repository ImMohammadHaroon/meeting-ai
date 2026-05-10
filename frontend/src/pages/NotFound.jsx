import { Link } from 'react-router-dom';
import { Glitchy404 } from '@/components/ui/glitchy-404-1';
import { useIsMobile } from '@/hooks/useMediaQuery';

const NotFound = () => {
  const isMobile = useIsMobile();
  const width = isMobile ? 340 : 800;
  const height = Math.round((232 / 860) * width);

  return (
    <div className="min-h-screen overflow-hidden bg-black text-white flex flex-col items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-4xl flex-col items-center gap-10">
        <div className="w-full flex justify-center overflow-x-auto">
          <Glitchy404 width={width} height={height} color="#ffffff" />
        </div>
        <div className="space-y-3 text-center">
          <h1 className="text-xl font-semibold md:text-2xl">Page not found</h1>
          <p className="mx-auto max-w-md text-sm text-white/60 md:text-base">
            This URL doesn&apos;t match any page. Check the link or head back to the home screen.
          </p>
          <div className="pt-2">
            <Link to="/" className="btn-primary inline-flex items-center gap-2">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
