/**
 * Guardian Tests for page.tsx
 * 
 * These tests act as guardians to ensure page.tsx remains clean and minimal.
 * They will FAIL if someone tries to add complexity back to the file.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

describe('page.tsx Guardian Tests - Protect Against Regression', () => {
  let pageContent: string;
  let pageLines: string[];

  beforeAll(() => {
    const pagePath = join(__dirname, '../page.tsx');
    pageContent = readFileSync(pagePath, 'utf-8');
    pageLines = pageContent.split('\n');
  });

  describe('Size Constraints', () => {
    test('must have less than 50 lines total', () => {
      expect(pageLines.length).toBeLessThan(50);
    });

    test('must have less than 30 lines of actual code (excluding comments)', () => {
      const codeLines = pageLines.filter(line => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith('*') && !trimmed.startsWith('//');
      });
      expect(codeLines.length).toBeLessThan(30);
    });

    test('must have exactly 2 imports', () => {
      const importLines = pageLines.filter(line => 
        line.trim().startsWith('import') && !line.includes('*')
      );
      expect(importLines.length).toBe(2);
    });
  });

  describe('Complexity Constraints', () => {
    test('must NOT contain useState', () => {
      // Check only in actual code, not in comments
      const codeWithoutComments = pageLines
        .filter(line => !line.trim().startsWith('*') && !line.trim().startsWith('//'))
        .join('\n');
      expect(codeWithoutComments).not.toContain('useState');
    });

    test('must NOT contain useEffect', () => {
      // Check only in actual code, not in comments
      const codeWithoutComments = pageLines
        .filter(line => !line.trim().startsWith('*') && !line.trim().startsWith('//'))
        .join('\n');
      expect(codeWithoutComments).not.toContain('useEffect');
    });

    test('must NOT contain useCallback', () => {
      expect(pageContent).not.toContain('useCallback');
    });

    test('must NOT contain useMemo', () => {
      expect(pageContent).not.toContain('useMemo');
    });

    test('must NOT contain useRef', () => {
      expect(pageContent).not.toContain('useRef');
    });

    test('must NOT contain event handlers', () => {
      expect(pageContent).not.toMatch(/on[A-Z]\w+=/);
      expect(pageContent).not.toContain('onClick');
      expect(pageContent).not.toContain('onChange');
      expect(pageContent).not.toContain('onSubmit');
    });

    test('must NOT contain function definitions beyond the default export', () => {
      const functionMatches = pageContent.match(/function\s+\w+/g) || [];
      const arrowFunctions = pageContent.match(/const\s+\w+\s*=\s*\(/g) || [];
      
      // Should only have the default function
      expect(functionMatches.length).toBe(1);
      expect(arrowFunctions.length).toBe(0);
    });

    test('must NOT contain conditional logic', () => {
      expect(pageContent).not.toContain('if (');
      expect(pageContent).not.toContain('if(');
      expect(pageContent).not.toMatch(/\?\s*:/); // ternary operator
      expect(pageContent).not.toContain('switch');
    });

    test('must NOT contain loops', () => {
      expect(pageContent).not.toContain('for (');
      expect(pageContent).not.toContain('for(');
      expect(pageContent).not.toContain('while');
      expect(pageContent).not.toContain('.map(');
      expect(pageContent).not.toContain('.forEach(');
    });
  });

  describe('Required Structure', () => {
    test('must export default function Home', () => {
      expect(pageContent).toMatch(/export\s+default\s+function\s+Home/);
    });

    test('must render only QRGeneratorContainer', () => {
      expect(pageContent).toContain('<QRGeneratorContainer />');
      
      // Count JSX elements (should only be one)
      const jsxElements = pageContent.match(/<[A-Z]\w+/g) || [];
      expect(jsxElements.length).toBe(1);
    });

    test('must have @protected tag in header comment', () => {
      expect(pageContent).toContain('@protected');
    });

    test('must have @performance-critical tag', () => {
      expect(pageContent).toContain('@performance-critical');
    });

    test('must have @max-lines tag', () => {
      expect(pageContent).toContain('@max-lines');
    });
  });

  describe('Import Constraints', () => {
    test('must import React', () => {
      expect(pageContent).toMatch(/import\s+React\s+from\s+['"]react['"]/);
    });

    test('must import QRGeneratorContainer from correct path', () => {
      expect(pageContent).toContain("from '@/components/generator/QRGeneratorContainer'");
    });

    test('must NOT import additional dependencies', () => {
      const imports = pageContent.match(/import\s+.+\s+from/g) || [];
      expect(imports.length).toBe(2);
    });
  });

  describe('Performance Markers', () => {
    test('must use "use client" directive', () => {
      expect(pageContent).toContain("'use client'");
    });

    test('must mention traffic percentage in comments', () => {
      expect(pageContent).toMatch(/80%\+?\s*(of\s+)?traffic/i);
    });

    test('must reference the refactoring metrics', () => {
      expect(pageContent).toContain('1,154 lines to 27 lines');
      expect(pageContent).toContain('97.6%');
    });
  });
});