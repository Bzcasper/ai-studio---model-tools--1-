
import React from 'react';

const WandIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.53 16.122a3 3 0 00-3.48-2.146l-4.11-2.146a.5.5 0 01.15-.886l4.436-1.57a3 3 0 002.43-2.43l1.57-4.436a.5.5 0 01.886.15l2.146 4.11a3 3 0 002.146 3.48l2.146 4.11a.5.5 0 01-.15.886l-4.436 1.57a3 3 0 00-2.43 2.43l-1.57 4.436a.5.5 0 01-.886-.15l-2.146-4.11zM11.63 4.113L10.5 2.25l-1.13 1.863a3 3 0 00-1.63 1.63L6 6.75l1.863 1.13a3 3 0 001.63 1.63L10.5 10.5l1.13-1.863a3 3 0 001.63-1.63L14.25 6l-1.863-1.13a3 3 0 00-1.63-1.63zM19.5 14.25l-1.13 1.863a3 3 0 00-1.63 1.63L15.75 19.5l1.13-1.863a3 3 0 001.63-1.63L19.5 15l-1.13-1.863a3 3 0 00-1.63-1.63L15.75 10.5l1.863 1.13a3 3 0 001.63 1.63L19.5 14.25z"
    />
  </svg>
);

export default WandIcon;
