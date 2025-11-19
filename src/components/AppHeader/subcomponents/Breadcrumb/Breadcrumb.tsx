import React, { JSX } from "react";
import Link from "next/link";
import { LockIcon } from "@primer/octicons-react";
import styles from "./Breadcrumb.module.css";
import { BreadcrumbItem } from "@/types/navigation";

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb = React.memo<BreadcrumbProps>(
  ({ items }): JSX.Element => {
    return (
      <nav className={styles.breadcrumb} aria-label="Breadcrumb navigation">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <div key={index} className={styles.breadcrumbItem}>
              {item.href ? (
                <Link
                  href={item.href}
                  className={`${styles.breadcrumbLink} ${
                    isLast ? styles.breadcrumbActive : ""
                  }`}
                >
                  {item.label}
                  {item.isPrivate && (
                    <LockIcon size={12} className={styles.lockIcon} />
                  )}
                </Link>
              ) : (
                <span
                  className={`${styles.breadcrumbLink} ${
                    isLast ? styles.breadcrumbActive : ""
                  }`}
                >
                  {item.label}
                  {item.isPrivate && (
                    <LockIcon size={12} className={styles.lockIcon} />
                  )}
                </span>
              )}
            </div>
          );
        })}
      </nav>
    );
  }
);

Breadcrumb.displayName = "Breadcrumb";
