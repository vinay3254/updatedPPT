export default function PremiumIcon({ Icon, className = "" }) {
  return (
    <div
      className="
        group
        flex flex-col items-center justify-center
        transition-all duration-200
        hover:scale-110
        active:scale-95
        cursor-pointer
      "
    >
      <div
        className="
          p-2 rounded-lg
          transition-all duration-200
          group-hover:bg-[#C6A437]/10
        "
      >
        <Icon
          className={`
            w-7 h-7
            text-[#C6A437]
            transition-all duration-200
            group-hover:text-[#E0C15A]
            group-hover:drop-shadow-[0_0_6px_rgba(198,164,55,0.5)]
            ${className}
          `}
          strokeWidth={2.5}
        />
      </div>
    </div>
  );
}
