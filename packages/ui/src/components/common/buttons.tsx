export function Button({
    className = '',
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={`cursor-pointer hover:hue-rotate-30 px-8 py-3 rounded-full border-2 border-white text-white font-semibold focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900 ${className}`}
        />
    );
}
