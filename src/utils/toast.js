import toast from 'react-hot-toast';

// Custom toast configurations - COOL & MODERN
const toastConfig = {
  success: {
    duration: 3000,
    position: 'top-center',
    style: {
      background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
      color: '#fff',
      padding: '16px 20px',
      borderRadius: '16px',
      fontSize: '14px',
      fontWeight: '600',
      boxShadow: '0 10px 25px -5px rgba(6, 182, 212, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      maxWidth: '90%',
      margin: '0 auto',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#06b6d4',
    },
  },
  error: {
    duration: 4000,
    position: 'top-center',
    style: {
      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
      color: '#fff',
      padding: '16px 20px',
      borderRadius: '16px',
      fontSize: '14px',
      fontWeight: '600',
      boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      maxWidth: '90%',
      margin: '0 auto',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#ef4444',
    },
  },
  loading: {
    duration: Infinity,
    position: 'top-center',
    style: {
      background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
      color: '#fff',
      padding: '16px 20px',
      borderRadius: '16px',
      fontSize: '14px',
      fontWeight: '600',
      boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      maxWidth: '90%',
      margin: '0 auto',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#7c3aed',
    },
  },
  info: {
    duration: 3000,
    position: 'top-center',
    style: {
      background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
      color: '#fff',
      padding: '16px 20px',
      borderRadius: '16px',
      fontSize: '14px',
      fontWeight: '600',
      boxShadow: '0 10px 25px -5px rgba(139, 92, 246, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      maxWidth: '90%',
      margin: '0 auto',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#7c3aed',
    },
  },
  warning: {
    duration: 3500,
    position: 'top-center',
    style: {
      background: 'linear-gradient(135deg, #ff6b6b, #ef4444)',
      color: '#fff',
      padding: '16px 20px',
      borderRadius: '16px',
      fontSize: '14px',
      fontWeight: '600',
      boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      maxWidth: '90%',
      margin: '0 auto',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#ff6b6b',
    },
  },
  // 🎨 Custom cool toast for special occasions
  cool: {
    duration: 4000,
    position: 'top-center',
    style: {
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      color: '#fff',
      padding: '16px 24px',
      borderRadius: '20px',
      fontSize: '15px',
      fontWeight: '700',
      boxShadow: '0 20px 30px -10px rgba(102, 126, 234, 0.5)',
      border: '2px solid rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(12px)',
      maxWidth: '90%',
      margin: '0 auto',
      letterSpacing: '0.5px',
    },
    icon: '✨',
  },
};

// Animation keyframes (add to your global CSS)
const toastAnimations = `
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes slideOut {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
`;

// Inject animations into the document (if not already present)
if (typeof document !== 'undefined' && !document.getElementById('toast-animations')) {
  const style = document.createElement('style');
  style.id = 'toast-animations';
  style.innerHTML = toastAnimations;
  document.head.appendChild(style);
}

// Toast utility functions
export const showToast = {
  // Basic toasts
  success: (message, options = {}) => {
    return toast.success(message, {
      ...toastConfig.success,
      ...options,
      style: {
        ...toastConfig.success.style,
        ...options.style,
        animation: 'slideIn 0.3s ease',
      },
    });
  },
  
  error: (message, options = {}) => {
    return toast.error(message, {
      ...toastConfig.error,
      ...options,
      style: {
        ...toastConfig.error.style,
        ...options.style,
        animation: 'slideIn 0.3s ease',
      },
    });
  },
  
  loading: (message, options = {}) => {
    return toast.loading(message, {
      ...toastConfig.loading,
      ...options,
      style: {
        ...toastConfig.loading.style,
        ...options.style,
        animation: 'slideIn 0.3s ease',
      },
    });
  },
  
  info: (message, options = {}) => {
    return toast(message, {
      ...toastConfig.info,
      ...options,
      style: {
        ...toastConfig.info.style,
        ...options.style,
        animation: 'slideIn 0.3s ease',
      },
    });
  },
  
  warning: (message, options = {}) => {
    return toast(message, {
      ...toastConfig.warning,
      icon: '⚠️',
      ...options,
      style: {
        ...toastConfig.warning.style,
        ...options.style,
        animation: 'slideIn 0.3s ease',
      },
    });
  },
  
  // 🎨 COOL special toast
  cool: (message, options = {}) => {
    return toast(message, {
      ...toastConfig.cool,
      ...options,
      style: {
        ...toastConfig.cool.style,
        ...options.style,
        animation: 'slideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
      },
    });
  },

  // Promise toast with better styling
  promise: (promise, messages, options = {}) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading || 'Loading...',
        success: messages.success || 'Success!',
        error: messages.error || 'Error occurred',
      },
      {
        success: {
          ...toastConfig.success,
          style: {
            ...toastConfig.success.style,
            animation: 'slideIn 0.3s ease',
          },
        },
        error: {
          ...toastConfig.error,
          style: {
            ...toastConfig.error.style,
            animation: 'slideIn 0.3s ease',
          },
        },
        loading: {
          ...toastConfig.loading,
          style: {
            ...toastConfig.loading.style,
            animation: 'slideIn 0.3s ease',
          },
        },
        ...options,
      }
    );
  },

  // Custom toast with full control
  custom: (message, config) => {
    return toast(message, config);
  },

  // Dismiss functions
  dismiss: (toastId) => toast.dismiss(toastId),
  dismissAll: () => toast.dismiss(),

  // Update existing toast
  update: (toastId, type, message) => {
    toast[type]?.(message, { id: toastId });
  },

  // Success with emoji variations
  successWithIcon: (message, icon = '✅') => {
    return toast.success(message, {
      ...toastConfig.success,
      icon,
      style: {
        ...toastConfig.success.style,
        animation: 'slideIn 0.3s ease',
      },
    });
  },

  // 🎉 Celebration toast
  celebrate: (message) => {
    return toast(message, {
      duration: 5000,
      icon: '🎉',
      style: {
        background: 'linear-gradient(135deg, #ff7a7a, #ff6b6b)',
        color: '#fff',
        padding: '18px 24px',
        borderRadius: '30px',
        fontSize: '16px',
        fontWeight: '800',
        boxShadow: '0 20px 30px -10px rgba(245, 158, 11, 0.5)',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        animation: 'slideIn 0.4s ease, pulse 2s infinite',
        textAlign: 'center',
      },
    });
  },
};

// Pre-made toast messages for common actions
export const toastMessages = {
  // Auth messages
  loginSuccess: '✅ Welcome back! Successfully logged in.',
  loginError: '❌ Login failed. Please check your credentials.',
  registerSuccess: '🎉 Account created successfully!',
  registerError: '❌ Registration failed. Please try again.',
  logout: '👋 See you soon! Logged out successfully.',
  
  // Survey messages
  surveyStart: '📝 Starting your survey...',
  surveyComplete: '🎯 Survey completed! KES 150 added to your balance.',
  surveyError: '❌ Failed to submit survey. Please try again.',
  
  // Withdrawal messages
  withdrawSuccess: '💰 Withdrawal request submitted successfully!',
  withdrawError: '❌ Withdrawal failed. Please check your balance.',
  withdrawProcessing: '⏳ Processing your withdrawal...',
  
  // Activation messages
  activationSuccess: '🔓 Account activated successfully!',
  activationError: '❌ Activation failed. Please check your payment.',
  
  // General messages
  copied: '📋 Copied to clipboard!',
  networkError: '📡 Network error. Please check your connection.',
  saving: '💾 Saving your changes...',
  saved: '✅ Changes saved successfully!',
  loading: '⏳ Loading...',
};

export default showToast;