import type { ReactNode } from "react";
import Link from "next/link";

type RunLinkProps = {
  href: string;
  children: ReactNode;
  external?: boolean;
  className?: string;
};

export default function RunLink({ href, children, external = false, className = "" }: RunLinkProps) {
  const classes = `run-press ${className}`.trim();

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
