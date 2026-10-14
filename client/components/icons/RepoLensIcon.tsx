import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

type RepoLensIconProps = SVGProps<SVGSVGElement> & {
  variant?: "color" | "mono";
};

export function RepoLensIcon({
  className,
  variant = "color",
  ...props
}: RepoLensIconProps) {
  const mono = variant === "mono";

  return (
    <svg
      viewBox="0 0 1024 1024"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("shrink-0", className)}
      {...props}
    >
      <defs>
        {!mono && (
          <>
            <linearGradient id="RepoLensIcon-lens" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#168BFF" />
              <stop offset="0.55" stopColor="#16C7E8" />
              <stop offset="1" stopColor="#2FE3B5" />
            </linearGradient>

            <linearGradient id="RepoLensIcon-card1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#473BFF" />
              <stop offset="1" stopColor="#735CFF" />
            </linearGradient>

            <linearGradient id="RepoLensIcon-card2" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#087CFF" />
              <stop offset="1" stopColor="#17BCEB" />
            </linearGradient>

            <linearGradient id="RepoLensIcon-card3" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#1266D8" />
              <stop offset="1" stopColor="#16D6C0" />
            </linearGradient>

            <linearGradient id="RepoLensIcon-code" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#1FAEFF" />
              <stop offset="1" stopColor="#2DE8C1" />
            </linearGradient>
          </>
        )}
      </defs>

      {/* Repository cards */}
      <rect
        x="650"
        y="180"
        width="245"
        height="82"
        rx="25"
        fill={mono ? "currentColor" : "url(#RepoLensIcon-card1)"}
      />
      <rect
        x="675"
        y="245"
        width="285"
        height="86"
        rx="27"
        fill={mono ? "currentColor" : "url(#RepoLensIcon-card2)"}
      />
      <rect
        x="700"
        y="315"
        width="315"
        height="92"
        rx="29"
        fill={mono ? "currentColor" : "url(#RepoLensIcon-card3)"}
      />
      <rect
        x="748"
        y="390"
        width="265"
        height="235"
        rx="35"
        fill={mono ? "currentColor" : "#073A91"}
      />

      {/* Code symbol */}
      <path
        d="M835 485L785 535L835 585"
        fill="none"
        stroke={mono ? "var(--background)" : "url(#RepoLensIcon-code)"}
        strokeWidth="30"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M920 485L970 535L920 585"
        fill="none"
        stroke={mono ? "var(--background)" : "url(#RepoLensIcon-code)"}
        strokeWidth="30"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M895 455L860 615"
        fill="none"
        stroke={mono ? "var(--background)" : "url(#RepoLensIcon-code)"}
        strokeWidth="28"
        strokeLinecap="round"
      />

      {/* Magnifying glass */}
      <circle
        cx="430"
        cy="465"
        r="300"
        fill="none"
        stroke={mono ? "currentColor" : "url(#RepoLensIcon-lens)"}
        strokeWidth="72"
      />
      <path
        d="M645 680L805 840"
        fill="none"
        stroke={mono ? "currentColor" : "url(#RepoLensIcon-lens)"}
        strokeWidth="72"
        strokeLinecap="round"
      />

      {/* Lens */}
      <circle
        cx="430"
        cy="465"
        r="250"
        fill={mono ? "var(--background)" : "#F8FAFF"}
      />
      <circle
        cx="430"
        cy="465"
        r="250"
        fill="none"
        stroke={mono ? "currentColor" : "#0A1838"}
        strokeWidth="22"
      />

      {/* GitHub-style cat mark */}
      <path
        d="M300 350C270 370 260 410 270 450C275 480 292 500 315 515C300 535 300 565 315 585C330 605 355 610 380 600V660C410 675 450 675 480 660V600C505 610 530 605 545 585C560 565 560 535 545 515C568 500 585 480 590 450C600 410 590 370 560 350L525 375C495 360 465 355 430 355C395 355 365 360 335 375L300 350Z"
        fill={mono ? "currentColor" : "#081532"}
      />

      {/* Cat ears */}
      <path
        d="M300 350V285L355 325Z"
        fill={mono ? "currentColor" : "#081532"}
      />
      <path
        d="M560 350V285L505 325Z"
        fill={mono ? "currentColor" : "#081532"}
      />

      {/* Cat cutout accents */}
      <path
        d="M315 515C290 505 275 490 270 470"
        fill="none"
        stroke={mono ? "var(--background)" : "#F8FAFF"}
        strokeWidth="18"
        strokeLinecap="round"
      />
      <path
        d="M350 535C365 550 390 555 405 555"
        fill="none"
        stroke={mono ? "var(--background)" : "#F8FAFF"}
        strokeWidth="14"
        strokeLinecap="round"
      />
    </svg>
  );
}
