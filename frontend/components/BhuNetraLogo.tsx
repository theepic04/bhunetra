import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * BhuNetra Symbol:
 * The graphical symbol portion of the official BhuNetra logo:
 * Mountain peaks + eye emblem + radar warning signals.
 */
export const BhuNetraSymbol: React.FC<LogoProps> = ({ className = 'w-9 h-9' }) => {
  return (
    <svg
      viewBox="120 70 340 270"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="BhuNetra Symbol"
    >
      {/* Radar Waves emanating from top right */}
      <g fill="none" strokeLinecap="round">
        <path d="M 335 140 A 42 42 0 0 1 380 178" stroke="#9ec93b" strokeWidth="8" />
        <path d="M 335 108 A 74 74 0 0 1 414 176" stroke="#b8d799" strokeWidth="8" />
        <path d="M 335 76 A 106 106 0 0 1 448 174" stroke="#d5e7c3" strokeWidth="8" />
      </g>

      {/* Mountain: Left ridge & summit */}
      <path d="M 138 232 L 208 145 L 216 153 L 300 82 L 356 166 L 300 186 Z" fill="#253443" />
      {/* Mountain facet shadow */}
      <path d="M 300 82 L 300 186 L 258 178 Z" fill="#1c2833" />

      {/* Mountain: Right sage green slope */}
      <path d="M 300 186 L 300 126 L 382 178 L 424 236 L 338 194 Z" fill="#597a65" />
      <path d="M 300 126 L 356 166 L 300 186 Z" fill="#44614e" />

      {/* Eye: Upper Eyelid */}
      <path d="M 152 248 C 200 196, 280 182, 300 182 C 320 182, 400 196, 448 248 C 412 216, 346 202, 300 202 C 254 202, 188 216, 152 248 Z" fill="#253443" />
      {/* Eye: Right flourish crease */}
      <path d="M 384 236 C 410 248, 436 256, 458 258 C 432 252, 404 244, 384 236 Z" fill="#253443" />

      {/* Eye: Lower Eyelid */}
      <path d="M 152 254 C 196 304, 268 318, 300 318 C 332 318, 404 304, 448 254 C 410 292, 342 298, 300 298 C 258 298, 190 292, 152 254 Z" fill="#253443" />

      {/* Outer Iris Ring (Sage Green) */}
      <circle cx="300" cy="250" r="38" stroke="#597a65" strokeWidth="7" fill="#ffffff" />

      {/* Pupil (Dark Slate Navy) */}
      <circle cx="300" cy="250" r="24" fill="#253443" />

      {/* Specular Highlight Catchlight (White) */}
      <circle cx="309" cy="241" r="7.5" fill="#ffffff" />
    </svg>
  );
};

/**
 * Complete Official BhuNetra Logo:
 * Mountain + eye emblem + "BhuNetra" wordmark + "— See Risk, Save Lives —" tagline.
 */
export const BhuNetraLogo: React.FC<LogoProps> = ({ className = 'w-48 h-auto', size = 'md' }) => {
  const sizeClasses = {
    xs: 'w-28 h-auto',
    sm: 'w-36 h-auto',
    md: 'w-48 h-auto',
    lg: 'w-60 h-auto',
    xl: 'w-72 h-auto'
  };

  return (
    <svg
      viewBox="0 40 600 480"
      className={className || sizeClasses[size]}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Official BhuNetra Logo — See Risk, Save Lives"
    >
      <g id="bhunetra-emblem" transform="translate(50, 0)">
        {/* Radar Waves emanating from top right */}
        <g fill="none" strokeLinecap="round">
          <path d="M 285 140 A 42 42 0 0 1 330 178" stroke="#9ec93b" strokeWidth="8" />
          <path d="M 285 108 A 74 74 0 0 1 364 176" stroke="#b8d799" strokeWidth="8" />
          <path d="M 285 76 A 106 106 0 0 1 398 174" stroke="#d5e7c3" strokeWidth="8" />
        </g>

        {/* Mountain Left Ridge */}
        <path d="M 88 232 L 158 145 L 166 153 L 250 82 L 306 166 L 250 186 Z" fill="#253443" />
        <path d="M 250 82 L 250 186 L 208 178 Z" fill="#1c2833" />

        {/* Mountain Right Slope */}
        <path d="M 250 186 L 250 126 L 332 178 L 374 236 L 288 194 Z" fill="#597a65" />
        <path d="M 250 126 L 306 166 L 250 186 Z" fill="#44614e" />

        {/* Upper Eyelid */}
        <path d="M 102 248 C 150 196, 230 182, 250 182 C 270 182, 350 196, 398 248 C 362 216, 296 202, 250 202 C 204 202, 138 216, 102 248 Z" fill="#253443" />
        <path d="M 334 236 C 360 248, 386 256, 408 258 C 382 252, 354 244, 334 236 Z" fill="#253443" />

        {/* Lower Eyelid */}
        <path d="M 102 254 C 146 304, 218 318, 250 318 C 282 318, 354 304, 398 254 C 360 292, 292 298, 250 298 C 208 298, 140 292, 102 254 Z" fill="#253443" />

        {/* Iris */}
        <circle cx="250" cy="250" r="38" stroke="#597a65" strokeWidth="7" fill="#ffffff" />

        {/* Pupil */}
        <circle cx="250" cy="250" r="24" fill="#253443" />

        {/* Catchlight */}
        <circle cx="259" cy="241" r="7.5" fill="#ffffff" />
      </g>

      {/* Wordmark: BhuNetra */}
      <g id="bhunetra-wordmark" transform="translate(0, 395)">
        <text
          x="300"
          y="0"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, 'Public Sans', sans-serif"
          fontWeight="800"
          fontSize="68"
          letterSpacing="-1"
        >
          <tspan fill="#253443">Bhu</tspan>
          <tspan fill="#597a65">Netr</tspan>
          <tspan fill="#597a65" fontSize="58">a</tspan>
        </text>
      </g>

      {/* Tagline: — See Risk, Save Lives — */}
      <g id="bhunetra-tagline" transform="translate(0, 435)">
        <line x1="140" y1="-8" x2="182" y2="-8" stroke="#9ec93b" strokeWidth="3.5" strokeLinecap="round" />
        <text
          x="300"
          y="0"
          textAnchor="middle"
          fill="#253443"
          fontFamily="system-ui, -apple-system, 'Source Sans 3', sans-serif"
          fontSize="22"
          fontWeight="600"
          letterSpacing="0.5"
        >
          See Risk, Save Lives
        </text>
        <line x1="418" y1="-8" x2="460" y2="-8" stroke="#9ec93b" strokeWidth="3.5" strokeLinecap="round" />
      </g>
    </svg>
  );
};
