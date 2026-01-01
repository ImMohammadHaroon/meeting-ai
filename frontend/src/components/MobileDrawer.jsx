import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Mobile Drawer Component
 * Slide-out navigation drawer for mobile views
 */
export default function MobileDrawer({ isOpen, onClose, children, title, position = 'left' }) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const positionClasses = {
    left: {
      drawer: 'left-0',
      transform: isOpen ? 'translate-x-0' : '-translate-x-full'
    },
    right: {
      drawer: 'right-0',
      transform: isOpen ? 'translate-x-0' : 'translate-x-full'
    },
    bottom: {
      drawer: 'bottom-0 left-0 right-0 rounded-t-2xl max-h-[80vh]',
      transform: isOpen ? 'translate-y-0' : 'translate-y-full'
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`fixed ${positionClasses[position].drawer} top-0 ${
          position === 'bottom' ? '' : 'h-full'
        } w-80 max-w-[85vw] bg-[#0A0A0A] border-r border-white/10 z-50 transition-transform duration-300 ease-in-out ${
          positionClasses[position].transform
        } overflow-y-auto custom-scrollbar`}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Navigation drawer'}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 bg-[#0A0A0A] z-10">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              aria-label="Close drawer"
            >
              <X size={20} className="text-white/60" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className={title ? 'p-4' : 'p-0'}>
          {children}
        </div>
      </div>
    </>
  );
}
