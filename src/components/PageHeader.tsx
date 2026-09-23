import Link from "next/link";
import type { ReactNode } from "react";

export default function PageHeader({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return (
    <header className="page-header">
      <nav aria-label="Breadcrumb" className="breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">{title}</span></nav>
      <div className="page-heading"><h1>{title}</h1><p>{description}</p></div>
      {children && <div className="page-meta">{children}</div>}
    </header>
  );
}
