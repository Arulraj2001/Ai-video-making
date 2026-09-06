import React from "react";

export interface SiteContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

/**
 * SiteContainer
 * Enforces the strict 1280px max-width content container with responsive
 * horizontal breathing room (32px desktop, 24px tablet, 20px mobile).
 */
export const SiteContainer: React.FC<SiteContainerProps> = ({
  children,
  className = "",
  style,
  ...props
}) => {
  return (
    <div
      className={`site-container ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};
