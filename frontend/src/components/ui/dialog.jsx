import React from "react";

export const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
        {children}
      </div>
    </div>
  );
};

export const DialogContent = ({ children, className = "" }) => (
  <div className={`p-4 sm:p-6 ${className}`}>
    {children}
  </div>
);

export const DialogHeader = ({ children }) => (
  <div className="mb-4">{children}</div>
);

export const DialogTitle = ({ children, className = "" }) => (
  <h2 className={`text-lg sm:text-xl font-semibold ${className}`}>{children}</h2>
);

export const DialogTrigger = ({ asChild, children, onClick }) => {
  return React.cloneElement(children, { onClick });
};
