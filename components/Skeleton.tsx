import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

export function Skeleton({ className = '', width, height, borderRadius }: SkeletonProps) {
  return (
    <div
      className={`skeleton-loader ${className}`}
      style={{
        width: width || '100%',
        height: height || '20px',
        borderRadius: borderRadius || '4px',
      }}
    />
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="table-responsive">
      <table className="roster-table">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i}><Skeleton height="16px" width="80%" /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex}><Skeleton height="20px" width={colIndex === 0 ? '60%' : '90%'} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <Skeleton height="24px" width="40%" className="mb-4" />
      <Skeleton height="16px" width="100%" className="mb-2" />
      <Skeleton height="16px" width="80%" className="mb-2" />
      <Skeleton height="16px" width="90%" />
    </div>
  );
}
