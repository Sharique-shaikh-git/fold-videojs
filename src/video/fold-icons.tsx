import type { SVGProps } from 'react';

export function FoldPlayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d="M5.5 3.5L16 10L5.5 16.5V3.5Z" fill="currentColor" />
    </svg>
  );
}

export function FoldPauseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <rect x="4.5" y="3.5" width="3.5" height="13" rx="0.5" fill="currentColor" />
      <rect x="12" y="3.5" width="3.5" height="13" rx="0.5" fill="currentColor" />
    </svg>
  );
}

export function FoldRestartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path
        d="M3.5 10C3.5 6.41015 6.41015 3.5 10 3.5C13.5899 3.5 16.5 6.41015 16.5 10C16.5 13.5899 13.5899 16.5 10 16.5C7.5 16.5 5.3 15.0899 4.2 13"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path d="M3 5.5V9.5H7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FoldSeekBackwardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d="M9.5 5L3.5 10L9.5 15V5Z" fill="currentColor" />
      <path d="M16.5 5L10.5 10L16.5 15V5Z" fill="currentColor" />
    </svg>
  );
}

export function FoldSeekForwardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d="M3.5 5L9.5 10L3.5 15V5Z" fill="currentColor" />
      <path d="M10.5 5L16.5 10L10.5 15V5Z" fill="currentColor" />
    </svg>
  );
}

export function FoldVolumeHighIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d="M3.5 7.5H6.5L10.5 4.5V15.5L6.5 12.5H3.5V7.5Z" fill="currentColor" />
      <path
        d="M13.5 7C14.5 7.8 15 8.9 15 10C15 11.1 14.5 12.2 13.5 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M15.5 5C17.2 6.3 18 8.1 18 10C18 11.9 17.2 13.7 15.5 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FoldVolumeLowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d="M3.5 7.5H6.5L10.5 4.5V15.5L6.5 12.5H3.5V7.5Z" fill="currentColor" />
      <path
        d="M13.5 7C14.5 7.8 15 8.9 15 10C15 11.1 14.5 12.2 13.5 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FoldVolumeOffIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d="M3.5 7.5H6.5L10.5 4.5V15.5L6.5 12.5H3.5V7.5Z" fill="currentColor" />
      <path d="M13 7.5L17.5 12.5" stroke="var(--fold-vermilion, #F05B48)" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M17.5 7.5L13 12.5" stroke="var(--fold-vermilion, #F05B48)" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export function FoldFullscreenEnterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d="M3.5 7.5V3.5H7.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
      <path d="M16.5 7.5V3.5H12.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
      <path d="M3.5 12.5V16.5H7.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
      <path d="M16.5 12.5V16.5H12.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
    </svg>
  );
}

export function FoldFullscreenExitIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d="M7.5 3.5V7.5H3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
      <path d="M12.5 3.5V7.5H16.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
      <path d="M7.5 16.5V12.5H3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
      <path d="M12.5 16.5V12.5H16.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
    </svg>
  );
}

export function FoldPipEnterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <rect x="2.5" y="4" width="15" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9.5" y="8.5" width="6.5" height="6" rx="0.5" fill="currentColor" />
    </svg>
  );
}

export function FoldPipExitIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <rect x="2.5" y="4" width="15" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9.5" y="8.5" width="6.5" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.25" />
      <path d="M11 10L14.5 13" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

export function FoldCaptionsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8.2 8.3C8 7.8 7.4 7.5 6.8 7.5C5.8 7.5 5 8.4 5 10C5 11.6 5.8 12.5 6.8 12.5C7.4 12.5 8 12.2 8.2 11.7"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M14.2 8.3C14 7.8 13.4 7.5 12.8 7.5C11.8 7.5 11 8.4 11 10C11 11.6 11.8 12.5 12.8 12.5C13.4 12.5 14 12.2 14.2 11.7"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FoldCreaseIcon(props: SVGProps<SVGSVGElement> & { expanded?: boolean }) {
  const { expanded = false, ...rest } = props;
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{
        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 200ms ease',
      }}
      {...rest}
    >
      <path d="M4 12.5L10 6.5L16 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 15.5L10 9.5L16 15.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" opacity="0.45" />
    </svg>
  );
}

export function FoldSettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 2.5V5.5M10 14.5V17.5M2.5 10H5.5M14.5 10H17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4.7 4.7L6.8 6.8M13.2 13.2L15.3 15.3M4.7 15.3L6.8 13.2M13.2 6.8L15.3 4.7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}
