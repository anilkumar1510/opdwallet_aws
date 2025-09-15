import { Variants } from 'framer-motion'

// Page transition animations
export const pageTransitions: Variants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0.0, 0.2, 1]
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
      ease: [0.4, 0.0, 0.2, 1]
    }
  }
}

// Staggered list animations
export const listContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

export const listItem: Variants = {
  hidden: {
    opacity: 0,
    y: 20
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0.0, 0.2, 1]
    }
  }
}

// Card hover animations
export const cardHover: Variants = {
  rest: {
    scale: 1,
    boxShadow: "0 4px 24px rgba(2, 6, 23, 0.06)"
  },
  hover: {
    scale: 1.02,
    boxShadow: "0 10px 40px rgba(2, 6, 23, 0.08)",
    transition: {
      duration: 0.2,
      ease: [0.4, 0.0, 0.2, 1]
    }
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1
    }
  }
}

// Button animations
export const buttonVariants: Variants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
      ease: [0.4, 0.0, 0.2, 1]
    }
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1
    }
  }
}

// Modal/overlay animations
export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.4, 0.0, 0.2, 1]
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: [0.4, 0.0, 0.2, 1]
    }
  }
}

export const modalContent: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0.0, 0.2, 1],
      delay: 0.1
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2,
      ease: [0.4, 0.0, 0.2, 1]
    }
  }
}

// Slide up from bottom (mobile sheets)
export const slideUp: Variants = {
  hidden: {
    opacity: 0,
    y: '100%'
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0.0, 0.2, 1]
    }
  },
  exit: {
    opacity: 0,
    y: '100%',
    transition: {
      duration: 0.3,
      ease: [0.4, 0.0, 0.2, 1]
    }
  }
}

// Loading spinner animation
export const spinnerVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear"
    }
  }
}

// Pulse animation for loading states
export const pulseVariants: Variants = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

// Toast notification animations
export const toastVariants: Variants = {
  initial: {
    opacity: 0,
    x: 100,
    scale: 0.95
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.4, 0.0, 0.2, 1]
    }
  },
  exit: {
    opacity: 0,
    x: 100,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: [0.4, 0.0, 0.2, 1]
    }
  }
}

// Tab switching animation
export const tabContent: Variants = {
  hidden: {
    opacity: 0,
    x: -20
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0.0, 0.2, 1]
    }
  }
}

// Number counter animation
export const counterVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.4, 0.0, 0.2, 1]
    }
  }
}

// Skeleton shimmer animation config
export const shimmerConfig = {
  backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s ease-in-out infinite'
}

// Common easing functions
export const easings = {
  easeOutCubic: [0.4, 0.0, 0.2, 1],
  easeInOutCubic: [0.4, 0.0, 0.6, 1],
  easeOutQuart: [0.25, 1, 0.5, 1],
  easeInOutQuart: [0.76, 0, 0.24, 1]
} as const

// Animation presets for common durations
export const durations = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5
} as const

// Layout animation configs
export const layoutTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30
}

// Shared transition config
export const sharedTransition = {
  duration: 0.3,
  ease: easings.easeOutCubic
}