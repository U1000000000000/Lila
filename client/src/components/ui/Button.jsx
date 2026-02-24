/**
 * Button — reusable UI primitive.
 * Usage: <Button variant="primary" onClick={...}>Send</Button>
 */
export default function Button({ children, onClick, variant = "primary", className = "" }) {
  const base = "px-4 py-2 rounded font-medium transition";
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white",
    danger: "bg-red-600 hover:bg-red-500 text-white",
    ghost: "bg-transparent border border-gray-600 text-gray-300 hover:border-gray-400",
  };
  return (
    <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}
