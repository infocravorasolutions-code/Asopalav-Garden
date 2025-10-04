// Performance optimization utilities for the labor management system

// Debounce function for search inputs
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function for scroll events
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Memoization for expensive calculations
export const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

// Image lazy loading utility
export const lazyLoadImage = (img, src) => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const image = entry.target;
        image.src = src;
        image.classList.remove('lazy');
        observer.unobserve(image);
      }
    });
  });
  
  observer.observe(img);
  return observer;
};

// Batch API calls to reduce server load
export const batchApiCalls = async (apiCalls, batchSize = 5) => {
  const results = [];
  
  for (let i = 0; i < apiCalls.length; i += batchSize) {
    const batch = apiCalls.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(call => call()));
    results.push(...batchResults);
  }
  
  return results;
};

// Virtual scrolling for large lists
export const getVisibleItems = (items, scrollTop, itemHeight, containerHeight) => {
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + Math.ceil(containerHeight / itemHeight) + 1, items.length);
  
  return {
    visibleItems: items.slice(startIndex, endIndex),
    startIndex,
    endIndex,
    totalHeight: items.length * itemHeight
  };
};

// Cache management
export class CacheManager {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key) {
    if (this.cache.has(key)) {
      // Move to end (most recently used)
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return null;
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      // Remove least recently used
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear() {
    this.cache.clear();
  }
}

// Performance monitoring
export const performanceMonitor = {
  start: (label) => {
    performance.mark(`${label}-start`);
  },
  
  end: (label) => {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    const measure = performance.getEntriesByName(label)[0];
    console.log(`${label}: ${measure.duration.toFixed(2)}ms`);
    return measure.duration;
  }
};

// Optimize re-renders with React.memo equivalent for vanilla JS
export const shouldUpdate = (prevProps, nextProps, keys) => {
  return keys.some(key => prevProps[key] !== nextProps[key]);
};

// Image optimization
export const optimizeImage = (src, width, height, quality = 0.8) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(img, 0, 0, width, height);
      
      const optimizedSrc = canvas.toDataURL('image/jpeg', quality);
      resolve(optimizedSrc);
    };
    img.src = src;
  });
};

// Memory cleanup utility
export const cleanup = (cleanupFunctions) => {
  return () => {
    cleanupFunctions.forEach(cleanup => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    });
  };
};

