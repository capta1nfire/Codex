import React from 'react';

interface QRPlaceholderProps {
  size?: number;
  className?: string;
  isTyping?: boolean;
}

/**
 * Sophisticated QR placeholder component that displays a high-quality
 * mockup QR code while the user is typing. Engineered for performance
 * and visual fidelity.
 */
export const QRPlaceholder: React.FC<QRPlaceholderProps> = ({ 
  size = 256, 
  className = '',
  isTyping = false 
}) => {
  // Generate a static QR pattern that looks realistic
  const moduleSize = 8;
  const modules = Math.floor(size / moduleSize);
  
  // QR code patterns for corners (finder patterns)
  const isFinderPattern = (row: number, col: number): boolean => {
    // Top-left
    if ((row < 7 && col < 7) || 
        // Top-right
        (row < 7 && col >= modules - 7) || 
        // Bottom-left
        (row >= modules - 7 && col < 7)) {
      
      // Outer square
      if (row === 0 || row === 6 || col === 0 || col === 6 ||
          row === modules - 7 || row === modules - 1 ||
          col === modules - 7 || col === modules - 1) {
        return true;
      }
      
      // Inner filled square
      if ((row >= 2 && row <= 4 && col >= 2 && col <= 4) ||
          (row >= 2 && row <= 4 && col >= modules - 5 && col <= modules - 3) ||
          (row >= modules - 5 && row <= modules - 3 && col >= 2 && col <= 4)) {
        return true;
      }
    }
    
    return false;
  };
  
  // Timing patterns
  const isTimingPattern = (row: number, col: number): boolean => {
    return (row === 6 && col > 7 && col < modules - 8 && col % 2 === 0) ||
           (col === 6 && row > 7 && row < modules - 8 && row % 2 === 0);
  };
  
  // Generate pseudo-random data pattern
  const isDataModule = (row: number, col: number): boolean => {
    // Skip finder and timing areas
    if (isFinderPattern(row, col) || isTimingPattern(row, col)) {
      return false;
    }
    
    // Pseudo-random pattern based on position
    const seed = row * modules + col;
    return (seed * 2654435761) % 100 < 50;
  };

  return (
    <div className={`inline-block ${className}`}>
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`}
        className={`transition-all duration-300 ${isTyping ? 'opacity-40' : 'opacity-30'}`}
      >
        {/* Background */}
        <rect width={size} height={size} fill="white" />
        
        {/* QR modules */}
        {Array.from({ length: modules }).map((_, row) => (
          Array.from({ length: modules }).map((_, col) => {
            const shouldRender = isFinderPattern(row, col) || 
                               isTimingPattern(row, col) || 
                               isDataModule(row, col);
            
            if (!shouldRender) return null;
            
            return (
              <rect
                key={`${row}-${col}`}
                x={col * moduleSize}
                y={row * moduleSize}
                width={moduleSize}
                height={moduleSize}
                fill="#000000"
                className={`transition-opacity duration-150 ${
                  isTyping && !isFinderPattern(row, col) 
                    ? 'animate-pulse opacity-20' 
                    : ''
                }`}
              />
            );
          })
        ))}
        
        {/* Subtle overlay to indicate it's a placeholder */}
        <rect 
          width={size} 
          height={size} 
          fill="currentColor" 
          opacity={0.03}
          className="text-slate-400"
        />
      </svg>
      
      {/* Status indicator */}
      <div className={`text-center mt-2 text-xs transition-opacity duration-300 ${
        isTyping ? 'opacity-100' : 'opacity-0'
      }`}>
        <span className="text-slate-400 dark:text-slate-500">
          Esperando entrada completa...
        </span>
      </div>
    </div>
  );
};