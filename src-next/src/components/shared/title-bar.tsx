import Logo from "./logo";

export function TitleBar() {
  return (
    <div className="flex items-center h-9 px-3 gap-2 border-b border-background-800 bg-background-950 shrink-0 select-none">
      <Logo className="w-3.5 h-3.5 text-foreground-400" />
      <span className="text-xs text-foreground-400 font-medium tracking-wide">Factory</span>
    </div>
  );
}
