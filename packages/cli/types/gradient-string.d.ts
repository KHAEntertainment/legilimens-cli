declare module 'gradient-string' {
  type GradientFunction = (...text: string[]) => string;
  type GradientFactory = (colors: string[]) => GradientFunction;

  interface GradientStringModule {
    (...text: string[]): string;
    instagram: GradientFunction;
    atlas: GradientFunction;
    pastel: GradientFunction;
    [name: string]: GradientFunction;
  }

  const gradient: GradientStringModule & GradientFactory;
  export default gradient;
}
