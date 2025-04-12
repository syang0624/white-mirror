import React from "react";
import clsx from "clsx";

export function Card({ className, children, ...props }) {
    return (
        <div
            className={clsx(
                "rounded-2xl border border-gray-200 bg-white shadow-sm",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardContent({ className, children, ...props }) {
    return (
        <div className={clsx("p-6 pt-4", className)} {...props}>
            {children}
        </div>
    );
}
