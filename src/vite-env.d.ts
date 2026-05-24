/// <reference types="vite/client" />

declare module 'html2pdf.js' {
  const html2pdf: {
    (): {
      set(options: Record<string, unknown>): {
        from(element: HTMLElement): {
          save(): Promise<void>;
        };
      };
    };
    default: typeof html2pdf;
  };
  export default html2pdf;
}
