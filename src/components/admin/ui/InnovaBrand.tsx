'use client';

import Image from 'next/image';

export default function InnovaBrand({
  href = 'https://innova-webdev.com/',
  label = 'Innova',
  size = 22,
}: {
  href?: string;
  label?: string;
  size?: number;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
      aria-label={label}
      title={label}
    >
      <span
        aria-hidden="true"
        style={{ position: 'relative', width: size, height: size, flex: `0 0 ${size}px` }}
      >
        <Image
          src="/innova.png"
          alt=""
          fill
          sizes={`${size}px`}
          style={{ objectFit: 'contain' }}
        />
      </span>

      <span className="by-innova">{label}</span>
    </a>
  );
}