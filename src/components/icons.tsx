import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-6"
      {...props}
    >
      {children}
    </svg>
  );
}

export function ChatsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 11.5a7.5 7.5 0 0 1-11.2 6.5L4 19.5l1.5-4.3A7.5 7.5 0 1 1 20 11.5Z" />
    </Icon>
  );
}

export function ComposeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 20h8" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </Icon>
  );
}

export function BackIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m15 18-6-6 6-6" />
    </Icon>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </Icon>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 19V5M5 12l7-7 7 7" />
    </Icon>
  );
}

export function ArrowDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M19 12l-7 7-7-7" />
    </Icon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 16 16" strokeWidth={1.5} {...props}>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 5v3l2 1.5" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 16 16" strokeWidth={1.5} {...props}>
      <path d="m3 8.5 3 3 7-7" />
    </Icon>
  );
}

export function DoubleCheckIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 16 16" strokeWidth={1.5} {...props}>
      <path d="m1 8.5 3 3 7-7M8 11.5l7-7" />
    </Icon>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 16 16" strokeWidth={1.5} {...props}>
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 4.5V9M8 11.5v.01" />
    </Icon>
  );
}

/** Логотип MAX: градиентный «пузырь». */
export function MaxLogo({ className = 'size-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="max-logo-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#08d7f3" />
          <stop offset="0.5" stopColor="#526eff" />
          <stop offset="1" stopColor="#bf97ff" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="url(#max-logo-gradient)" />
      <path
        d="M20 10.5a9.5 9.5 0 0 0-8.3 14.1L10.5 29.5l5-1.2A9.5 9.5 0 1 0 20 10.5Z"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
