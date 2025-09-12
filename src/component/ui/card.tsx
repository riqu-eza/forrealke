import React from "react";

export const Card: React.FC<{ className?: string; children: React.ReactNode }> =
  ({ className = "", children }) => {
    return (
      <div
        className={`rounded-xl border bg-white shadow-sm p-4 ${className}`}
      >
        {children}
      </div>
    );
  };

export const CardHeader: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <div className="mb-2 font-semibold text-lg">{children}</div>;

export const CardTitle: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <h3 className="text-xl font-bold">{children}</h3>;

export const CardContent: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <div className="text-gray-700">{children}</div>;
