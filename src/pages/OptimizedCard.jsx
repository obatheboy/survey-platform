// OptimizedCard.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';

// Track scroll velocity globally to optimize loading
let lastScrollY = 0;
let globalScrollVelocity = 0;
let lastScrollTime = Date.now();

const updateScrollVelocity = () => {
  const currentTime = Date.now();
  const timeDiff = currentTime - lastScrollTime;
  
  if (timeDiff > 0) {
    globalScrollVelocity = Math.abs(window.scrollY - lastScrollY) / timeDiff;
  }
  
  lastScrollY = window.scrollY;
  lastScrollTime = currentTime;
};

// Add scroll listener for velocity tracking
if (typeof window !== 'undefined') {
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    updateScrollVelocity();
    
    // Clear previous timeout
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    
    // Reset velocity after scrolling stops
    scrollTimeout = setTimeout(() => {
      globalScrollVelocity = 0;
    }, 100);
  }, { passive: true });
}

const OptimizedCard = React.memo(({
  children,
  className = '',
  style = {},
  index = 0,
  cardType = 'section',
  scrollVelocity = globalScrollVelocity, // <-- ADDED: Accept prop, default to global
  scrollVelocityThreshold = 2 // pixels/ms - adjust based on testing
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const cardRef = useRef(null);
  const observerRef = useRef(null);
  const checkTimeoutRef = useRef(null);

  // Calculate viewport distance and priority
  const calculateViewportDistance = useCallback(() => {
    if (!cardRef.current) return Infinity;
    
    const rect = cardRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const cardCenter = rect.top + rect.height / 2;
    const viewportCenter = viewportHeight / 2;
    
    return Math.abs(cardCenter - viewportCenter);
  }, []);

  // Check if card should be loaded based on scroll velocity and position
  const checkShouldLoad = useCallback(() => {
    if (!cardRef.current || hasBeenVisible) return;
    
    const distance = calculateViewportDistance();
    const viewportHeight = window.innerHeight;
    
    // Dynamic loading based on scroll speed
    let loadBuffer = 150; // Default buffer
    
    if (scrollVelocity > scrollVelocityThreshold) {
      // Fast scrolling - increase buffer to load cards earlier
      loadBuffer = 300 + (scrollVelocity * 50);
    } else if (scrollVelocity > 0.5) {
      // Medium scrolling
      loadBuffer = 200;
    }
    
    // Load if card is within buffer distance
    const shouldLoadNow = distance < (viewportHeight + loadBuffer);
    
    if (shouldLoadNow && !shouldLoad) {
      setShouldLoad(true);
      
      // If very close, load immediately
      if (distance < viewportHeight) {
        setIsVisible(true);
        setHasBeenVisible(true);
      }
    }
    
    return shouldLoadNow;
  }, [hasBeenVisible, scrollVelocityThreshold, shouldLoad, calculateViewportDistance, scrollVelocity]); // <-- Added scrollVelocity dependency

  useEffect(() => {
    // Create intersection observer with dynamic rootMargin based on scroll velocity
    const rootMargin = scrollVelocity > scrollVelocityThreshold 
      ? '300px 0px' 
      : '150px 0px';
    
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setHasBeenVisible(true);
          
          // Once visible, we can unobserve to save resources
          if (observerRef.current && cardRef.current) {
            observerRef.current.unobserve(cardRef.current);
          }
        }
      },
      {
        root: null,
        rootMargin,
        threshold: 0.01
      }
    );

    // Start observing
    if (cardRef.current) {
      observerRef.current.observe(cardRef.current);
      
      // Also check immediately for cards already in viewport
      const rect = cardRef.current.getBoundingClientRect();
      const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
      
      if (isInViewport) {
        setIsVisible(true);
        setHasBeenVisible(true);
      } else {
        // Check if should pre-load based on position
        checkShouldLoad();
      }
    }

    // Add scroll listener for dynamic loading
    const handleScroll = () => {
      if (hasBeenVisible) return;
      
      checkShouldLoad();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Periodic check for cards that might have been missed
    checkTimeoutRef.current = setInterval(() => {
      if (!hasBeenVisible) {
        checkShouldLoad();
      }
    }, 500);

    return () => {
      if (observerRef.current && cardRef.current) {
        observerRef.current.unobserve(cardRef.current);
      }
      window.removeEventListener('scroll', handleScroll);
      if (checkTimeoutRef.current) {
        clearInterval(checkTimeoutRef.current);
      }
    };
  }, [hasBeenVisible, checkShouldLoad, scrollVelocityThreshold, scrollVelocity]); // <-- Added scrollVelocity dependency

  // Calculate animation delay based on index and scroll velocity
  const getAnimationDelay = () => {
    let baseDelay = index * 30; // 30ms per card
    
    // Adjust delay based on scroll velocity
    if (scrollVelocity > scrollVelocityThreshold) {
      // Fast scrolling - reduce delay for smoother experience
      baseDelay = index * 15;
    }
    
    return baseDelay;
  };

  // Calculate opacity based on visibility and scroll position
  const getOpacity = () => {
    if (isVisible) return 1;
    if (!shouldLoad) return 0;
    
    // Calculate smooth opacity based on distance from viewport
    const distance = calculateViewportDistance();
    const viewportHeight = window.innerHeight;
    const maxDistance = viewportHeight * 1.5;
    
    return Math.max(0, 1 - (distance / maxDistance));
  };

  const cardStyle = {
    ...style,
    '--card-index': index,
    '--section-index': Math.floor(index / 3),
    animationDelay: `${getAnimationDelay()}ms`,
    opacity: getOpacity(),
    transform: isVisible ? 'translate3d(0, 0, 0)' : 'translate3d(0, 20px, 0)',
    transition: hasBeenVisible 
      ? 'opacity 0.3s ease, transform 0.3s ease' 
      : 'none',
    willChange: 'transform, opacity',
    contain: 'layout style paint'
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
    >
      {shouldShowSkeleton ? (
        <div style={{ 
          height: cardType === 'plan' ? '280px' : 
                  cardType === 'stats' ? '180px' : 
                  cardType === 'withdraw' ? '320px' : '200px',
          background: 'linear-gradient(90deg, #f5f5f5 0%, #e8e8e8 50%, #f5f5f5 100%)',
          backgroundSize: '200% 100%',
          borderRadius: '12px',
          animation: 'shimmer 1.5s infinite'
        }} />
      ) : children}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function - only re-render if data actually changed
  return (
    prevProps.children === nextProps.children &&
    prevProps.className === nextProps.className &&
    JSON.stringify(prevProps.style) === JSON.stringify(nextProps.style) &&
    prevProps.index === nextProps.index &&
    prevProps.cardType === nextProps.cardType &&
    prevProps.scrollVelocity === nextProps.scrollVelocity // <-- Added scrollVelocity comparison
  );
});

export default OptimizedCard;