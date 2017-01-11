'use strict';

const expect = require('chai').expect;
const vio = require('../core/vio');
const refactor = require('../core/refactor');
const helpers = require('./helpers');

const expectFile = helpers.expectFile;
const expectFiles = helpers.expectFiles;
const expectNoFile = helpers.expectNoFile;
const expectNoFiles = helpers.expectNoFiles;
const expectLines = helpers.expectLines;
const expectNoLines = helpers.expectNoLines;

const V_FILE = '/vio-temp-file';

const CODE_1 = `\
export { a } from './a';
export b from './b';
export c, { d } from './d';

const v = 1;
`;

const CODE_2 = `\
const v = 1;
`;

const CODE_3 = `\
import A from './A';
import { C, D, Z } from './D';
import { E } from './E';
import F from './F';
`;

describe('reafctor tests', function() { // eslint-disable-line
  before(() => {
    vio.reset();
  });

  describe('addExportFromLine', () => {
    it('should add export as the last one when there\'re other exports', () => {
      vio.put(V_FILE, CODE_1);
      const line = "export { e } from './e';";
      refactor.addExportFromLine(V_FILE, line);
      const lines = vio.getLines(V_FILE);
      expect(lines[3]).to.equal(line);
    });

    it('should add export as the first line when no other export', () => {
      vio.put(V_FILE, CODE_2);
      const line = "export { e } from './e';";
      refactor.addExportFromLine(V_FILE, line);
      const lines = vio.getLines(V_FILE);
      expect(lines[0]).to.equal(line);
    });
  });

  describe('removeExportFromLine', () => {
    it('should remove the target line', () => {
      vio.put(V_FILE, CODE_1);
      const line = "export { a } from './a';";
      refactor.removeExportFromLine(V_FILE, './a');
      const lines = vio.getLines(V_FILE);
      expect(refactor.lineIndex(lines, line)).to.equal(-1);
    });

    it('should do nothing if no export is found', () => {
      vio.put(V_FILE, CODE_1);
      refactor.removeExportFromLine(V_FILE, './e');
      expect(vio.getContent(V_FILE)).to.equal(CODE_1);
    });
  });

  describe('addImport', () => {
    it('should add import line when no module source exist', () => {
      vio.put(V_FILE, CODE_3);
      refactor.addImport(V_FILE, './K', 'K');
      refactor.addImport(V_FILE, './L', 'L', 'L1');
      refactor.addImport(V_FILE, './M', '', 'M1');
      refactor.addImport(V_FILE, './N', 'N', ['N1', 'N2']);

      expectLines(V_FILE, [
        "import K from './K';",
        "import L, { L1 } from './L';",
        "import { M1 } from './M';",
        "import N, { N1, N2 } from './N';",
      ]);
    });

    it('should add import specifier(s) when module exist', () => {
      vio.put(V_FILE, CODE_3);
      refactor.addImport(V_FILE, './A', 'AA', 'A1');
      refactor.addImport(V_FILE, './D', 'W', 'Y');
      refactor.addImport(V_FILE, './E', '', ['E', 'E1']);
      refactor.addImport(V_FILE, './F', 'F');
      expectLines(V_FILE, [
        "import A, { A1 } from './A';",
        "import W, { C, D, Z, Y } from './D';",
        "import { E, E1 } from './E';",
      ]);
    });
  });

  describe('removeNamedImport', () => {
    it('should remove give import specifier', () => {
      vio.put(V_FILE, CODE_3);
      refactor.removeImportSpecifier(V_FILE, ['E', 'D']);
      expectLines(V_FILE, [
        "import { C, Z } from './D';",
      ]);
      expectNoLines(V_FILE, [
        "import { E } from './E';",
      ]);
    });
  });

  describe('removeNamedImport', () => {
    it('should remove give import specifier', () => {
      vio.put(V_FILE, CODE_3);
      refactor.removeImportSpecifier(V_FILE, ['E', 'D']);
      expectLines(V_FILE, [
        "import { C, Z } from './D';",
      ]);
      expectNoLines(V_FILE, [
        "import { E } from './E';",
      ]);
    });
  });

  describe('removeImportBySource', () => {
    it('should remove import statement by given source', () => {
      vio.put(V_FILE, CODE_3);
      refactor.removeImportBySource(V_FILE, './A');
      refactor.removeImportBySource(V_FILE, './D');
      expectNoLines(V_FILE, [
        "import A from './A';",
        "import { C, D, Z } from './D';",
      ]);
    });
  });
});

