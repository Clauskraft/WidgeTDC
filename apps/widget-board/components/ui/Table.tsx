import React from 'react';

export const Table: React.FC<React.HTMLAttributes<HTMLTableElement>> = ({ className = '', ...props }) => (
  <table className={`w-full text-sm border-collapse ${className}`} {...props} />
);

export const TableHead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className = '', ...props }) => (
  <thead className={`text-left text-xs uppercase text-slate-500 tracking-wide ${className}`} {...props} />
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className = '', ...props }) => (
  <tbody className={className} {...props} />
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className = '', ...props }) => (
  <tr className={`border-b border-slate-200 last:border-0 ${className}`} {...props} />
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className = '', ...props }) => (
  <td className={`py-2 pr-4 align-top ${className}`} {...props} />
);

export const TableHeader: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className = '', ...props }) => (
  <th className={`py-2 pr-4 font-semibold ${className}`} {...props} />
);
