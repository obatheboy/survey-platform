// OptimizedCard.jsx - FIXED VERSION
import React, { useState, useEffect, useRef, useCallback } from 'react';

// Custom hook for scroll velocity tracking
const useScrollVelocity = () => {
  const [scrollVelocity, setScrollVelocity] = useState(0);
  const lastScrollYRef = useRef(0);
  const lastScrollTimeRef = useRef(0);
  const rafIdRef = useRef(null);
  const velocityRef = useRef(0);

  useEffect(() => {
    let mounted = true;
    let timeoutId = null;
    
    // Initialize time ref after mount (not during render)
    lastScrollTimeRef.current = Date.now();

    const updateVelocity = () => {
      if (!mounted) return;

      const currentTime = Date.now();
      const timeDiff = currentTime - lastScrollTimeRef.current;
      const currentScrollY = window.scrollY;

      if (timeDiff > 0) {
        const velocity = Math.abs(currentScrollY - lastScrollYRef.current) / timeDiff;
        velocityRef.current = velocity;
        setScrollVelocity(velocity);
      }

      lastScrollYRef.current = currentScrollY;
      lastScrollTimeRef.current = currentTime;
    };

    const handleScroll = () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(updateVelocity);

      // Reset velocity after scrolling stops
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (mounted) {
          velocityRef.current = 0;
          setScrollVelocity(0);
        }
      }, 150);
    };

    // Throttle scroll events for better performance
    let lastScrollCall = 0;
    const throttledScroll = () => {
      const now = Date.now();
      if (now - lastScrollCall >= 16) { // ~60fps
        handleScroll();
        lastScrollCall = now;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });

    return () => {
      mounted = false;
      window.removeEventListener('scroll', throttledScroll);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return scrollVelocity;
};

const OptimizedCard = React.memo(({
  children,
  className = '',
  style = {},
  index = 0,
  cardType = 'section',
  scrollVelocityThreshold = 1.5
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const cardRef = useRef(null);
  const observerRef = useRef(null);
  const checkTimeoutRef = useRef(null);
  const intersectionDetectedRef = useRef(false);
  const viewportDistanceRef = useRef(Infinity);
  const opacityUpdateRef = useRef(null);
  
  // Use the custom hook for scroll velocity
  const scrollVelocity = useScrollVelocity();

  // Calculate viewport distance - ONLY in effects or callbacks
  const updateViewportDistance = useCallback(() => {
    if (!cardRef.current) {
      viewportDistanceRef.current = Infinity;
      return Infinity;
    }
    
    const rect = cardRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const cardCenter = rect.top + rect.height / 2;
    const viewportCenter = viewportHeight / 2;
    
    const distance = Math.abs(cardCenter - viewportCenter);
    viewportDistanceRef.current = distance;
    return distance;
  }, []);

  // Update opacity based on visibility and distance - uses requestAnimationFrame
  const updateOpacity = useCallback((immediate = false) => {
    if (opacityUpdateRef.current) {
      cancelAnimationFrame(opacityUpdateRef.current);
    }

    const update = () => {
      if (isVisible) {
        setOpacity(1);
        return;
      }
      
      if (!shouldLoad) {
        setOpacity(0);
        return;
      }
      
      // Calculate smooth opacity based on distance from viewport
      const distance = viewportDistanceRef.current;
      const viewportHeight = window.innerHeight;
      const maxDistance = viewportHeight * 1.2;
      
      const newOpacity = Math.max(0, 1 - (distance / maxDistance));
      setOpacity(newOpacity);
    };

    if (immediate) {
      update();
    } else {
      opacityUpdateRef.current = requestAnimationFrame(update);
    }
  }, [isVisible, shouldLoad]);

  // Optimized check if card should be loaded - uses requestAnimationFrame
  const checkShouldLoad = useCallback(() => {
    if (!cardRef.current || hasBeenVisible || intersectionDetectedRef.current) return false;
    
    updateViewportDistance();
    const distance = viewportDistanceRef.current;
    const viewportHeight = window.innerHeight;
    
    // Dynamic loading based on scroll speed
    let loadBuffer = 150; // Default buffer
    
    if (scrollVelocity > scrollVelocityThreshold) {
      // Fast scrolling - increase buffer to load cards earlier
      loadBuffer = Math.min(500, 300 + (scrollVelocity * 50)); // Cap at 500px
    } else if (scrollVelocity > 0.5) {
      // Medium scrolling
      loadBuffer = 200;
    }
    
    // Load if card is within buffer distance
    const shouldLoadNow = distance < (viewportHeight + loadBuffer);
    
    if (shouldLoadNow && !shouldLoad) {
      // Schedule state updates for next animation frame
      requestAnimationFrame(() => {
        setShouldLoad(true);
        
        // If very close, load immediately
        if (distance < viewportHeight * 0.8) {
          setIsVisible(true);
          setHasBeenVisible(true);
          intersectionDetectedRef.current = true;
          updateOpacity(true); // Immediate update for visible state
        }
      });
    }
    
    return shouldLoadNow;
  }, [hasBeenVisible, scrollVelocityThreshold, shouldLoad, updateViewportDistance, scrollVelocity, updateOpacity]);

  // Effect to update opacity when relevant states change - debounced
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateOpacity();
    }, 0); // Schedule for next event loop
    
    return () => clearTimeout(timeoutId);
  }, [isVisible, shouldLoad, updateOpacity]);

  useEffect(() => {
    // Capture the element reference at effect time to avoid cleanup issues
    const cardElement = cardRef.current;
    if (!cardElement) return;
    
    let mounted = true;
    let observer = null;

    // Create intersection observer with optimized settings
    const createObserver = () => {
      const rootMargin = scrollVelocity > scrollVelocityThreshold 
        ? '250px 0px'
        : '125px 0px';
      
      observer = new IntersectionObserver(
        (entries) => {
          if (!mounted) return;
          
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              // Schedule visibility updates for next animation frame
              requestAnimationFrame(() => {
                setIsVisible(true);
                setHasBeenVisible(true);
                setShouldLoad(true);
                intersectionDetectedRef.current = true;
                
                // Unobserve to save resources
                if (observer && cardElement) {
                  observer.unobserve(cardElement);
                }
              });
            }
          });
        },
        {
          root: null,
          rootMargin,
          threshold: 0.01,
          trackVisibility: true,
          delay: 100
        }
      );
      
      observer.observe(cardElement);
      observerRef.current = observer;
    };

    // Initial check for cards already in viewport
    const checkInitialVisibility = () => {
      if (!cardElement || !mounted) return false;
      
      updateViewportDistance();
      const rect = cardElement.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const buffer = 100;
      
      const isInViewport = rect.top < (viewportHeight + buffer) && rect.bottom > -buffer;
      
      if (isInViewport) {
        // Schedule initial visibility update
        requestAnimationFrame(() => {
          if (mounted) {
            setIsVisible(true);
            setHasBeenVisible(true);
            setShouldLoad(true);
            intersectionDetectedRef.current = true;
          }
        });
        return true;
      }
      
      return false;
    };

    // Only create observer if not initially visible
    if (!checkInitialVisibility()) {
      createObserver();
      
      // Add optimized scroll listener for dynamic loading
      let lastScrollCheck = 0;
      let scrollRafId = null;
      
      const handleScroll = () => {
        const now = Date.now();
        
        // Throttle scroll checks
        if (now - lastScrollCheck < 33) return;
        lastScrollCheck = now;
        
        if (hasBeenVisible || intersectionDetectedRef.current) return;
        
        if (scrollRafId) {
          cancelAnimationFrame(scrollRafId);
        }
        
        scrollRafId = requestAnimationFrame(() => {
          if (mounted && !intersectionDetectedRef.current) {
            updateViewportDistance();
            checkShouldLoad();
            updateOpacity();
          }
        });
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      
      // Periodic check - less frequent
      checkTimeoutRef.current = setInterval(() => {
        if (mounted && !hasBeenVisible && !intersectionDetectedRef.current) {
          updateViewportDistance();
          checkShouldLoad();
          updateOpacity();
        }
      }, 1000);

      return () => {
        mounted = false;
        if (observer && cardElement) {
          observer.unobserve(cardElement);
        }
        if (observerRef.current && cardElement) {
          observerRef.current.unobserve(cardElement);
        }
        window.removeEventListener('scroll', handleScroll);
        if (scrollRafId) {
          cancelAnimationFrame(scrollRafId);
        }
        if (checkTimeoutRef.current) {
          clearInterval(checkTimeoutRef.current);
        }
        if (opacityUpdateRef.current) {
          cancelAnimationFrame(opacityUpdateRef.current);
        }
      };
    }

    return () => {
      mounted = false;
      if (opacityUpdateRef.current) {
        cancelAnimationFrame(opacityUpdateRef.current);
      }
    };
  }, [hasBeenVisible, checkShouldLoad, scrollVelocityThreshold, scrollVelocity, updateViewportDistance, updateOpacity]);

  // Optimized animation delay calculation - no ref access here
  const getAnimationDelay = useCallback(() => {
    if (scrollVelocity > scrollVelocityThreshold) {
      return index * 10;
    }
    
    return index * 20;
  }, [index, scrollVelocity, scrollVelocityThreshold]);

  const cardStyle = {
    ...style,
    '--card-index': index,
    '--section-index': Math.floor(index / 3),
    animationDelay: `${getAnimationDelay()}ms`,
    opacity: opacity,
    transform: isVisible ? 'translate3d(0, 0, 0)' : 'translate3d(0, 20px, 0)',
    transition: hasBeenVisible 
      ? 'opacity 0.25s ease, transform 0.25s ease' 
      : 'none',
    willChange: hasBeenVisible ? 'transform, opacity' : 'auto',
    contain: 'layout style paint',
    backfaceVisibility: 'hidden',
    WebkitFontSmoothing: 'antialiased'
  };

  // Determine if we should show skeleton or content
  const shouldShowSkeleton = !hasBeenVisible && !shouldLoad;

  return (
    <div
      ref={cardRef}
      className={`${className} ${cardType}-card optimized-card`}
      style={cardStyle}
      data-visible={isVisible}
      data-index={index}
      data-scroll-velocity={scrollVelocity.toFixed(2)}
      data-loading={!hasBeenVisible}
    >
      {shouldShowSkeleton ? (
        <div 
          className="card-skeleton"
          style={{ 
            height: cardType === 'plan' ? '280px' : 
                    cardType === 'stats' ? '180px' : 
                    cardType === 'withdraw' ? '320px' : '200px',
          }}
        />
      ) : children}
    </div>
  );
}, (prevProps, nextProps) => {
  // Optimized comparison function
  return (
    prevProps.children === nextProps.children &&
    prevProps.className === nextProps.className &&
    prevProps.index === nextProps.index &&
    prevProps.cardType === nextProps.cardType &&
    JSON.stringify(prevProps.style) === JSON.stringify(nextProps.style)
  );
});

// Add CSS for skeleton loading
const skeletonStyles = `
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.card-skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 12px;
  animation: shimmer 2s infinite linear;
  will-change: background-position;
  transform: translateZ(0);
  backface-visibility: hidden;
}
`;

// Inject styles once
if (typeof document !== 'undefined') {
  const styleId = 'optimized-card-styles';
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = skeletonStyles;
    document.head.appendChild(styleSheet);
  }
}

export default OptimizedCard;