import { useState, useEffect } from 'react';

/**
 * A simple hook for client-side A/B testing.
 * @param {string} testKey - Unique key for the test (e.g., 'landing-hero-v1')
 * @param {Array<string>} variants - List of variant names (e.g., ['A', 'B'])
 * @returns {string} The assigned variant for the current user.
 */
export const useABTest = (testKey, variants = ['A', 'B']) => {
  const [variant, setVariant] = useState(null);

  useEffect(() => {
    const storageKey = `ab_test_${testKey}`;
    let assignedVariant = localStorage.getItem(storageKey);

    if (!assignedVariant || !variants.includes(assignedVariant)) {
      // Assign a random variant
      const randomIndex = Math.floor(Math.random() * variants.length);
      assignedVariant = variants[randomIndex];
      localStorage.setItem(storageKey, assignedVariant);
      
      console.log(`[A/B Test] Assigned user to variant: ${assignedVariant} for test: ${testKey}`);
    }

    setVariant(assignedVariant);
  }, [testKey, variants]);

  return variant;
};

/**
 * Utility to track events for a specific variant.
 */
export const trackABEvent = (testKey, variant, eventName) => {
  console.log(`[A/B Event] Test: ${testKey}, Variant: ${variant}, Event: ${eventName}`);
  // Here you would typically send data to Google Analytics, PostHog, etc.
};
