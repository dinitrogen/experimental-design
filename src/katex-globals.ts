import katex from 'katex';
import renderMathInElement from 'katex/contrib/auto-render';

(window as unknown as Record<string, unknown>)['katex'] = katex;
(window as unknown as Record<string, unknown>)['renderMathInElement'] = renderMathInElement;
