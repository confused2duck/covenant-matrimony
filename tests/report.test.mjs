import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {seed} from '../dist/data.mjs';
import {summarizeReport, createAggregateReport} from '../dist/report.mjs';

// Exercise the same vendored library shipped to the browser, without a network request.
const module = {exports:{}};
new Function('module','exports',readFileSync(new URL('../dist/vendor/pdf-lib.min.js',import.meta.url),'utf8'))(module,module.exports);
const pdfLib = module.exports;

test('report totals reflect current records, review decisions and assignment changes', () => {
  const state = seed();
  state.profiles.push({...state.profiles[0], id:'PDFTEST', status:'Under review', route:'church', state:'Kerala'});
  state.profiles.find(p => p.id === 'CM1005').status = 'Approved';
  state.cases.push({id:'PDFCASE', coordinator:null});
  const report = summarizeReport(state);
  assert.equal(report.total,13);
  assert.equal(report.approved,7);
  assert.equal(report.introductions,2);
  assert.equal(report.pendingAssignments,1);
  assert.deepEqual(report.routes,[['Online',3],['Branch',5],['Church',5]]);
  assert.equal(report.states.find(([label])=>label==='Kerala')[1],2);
  assert.equal(report.statuses.reduce((sum,[,n])=>sum+n,0),13);
});

test('export produces a readable A4 PDF, including empty workspaces', async () => {
  for (const state of [seed(), {profiles:[],cases:[]}]) {
    const bytes = await createAggregateReport(state,{pdfLib,generatedAt:new Date('2026-10-11T14:00:00Z')});
    assert.equal(new TextDecoder().decode(bytes.slice(0,5)),'%PDF-');
    const pdf = await pdfLib.PDFDocument.load(bytes);
    assert.equal(pdf.getPageCount(),1);
    assert.equal(Math.round(pdf.getPage(0).getWidth()),595);
    assert.equal(Math.round(pdf.getPage(0).getHeight()),842);
    assert.match(pdf.getTitle(),/Aggregate Report/);
    assert.equal(pdf.getCreationDate().toISOString(),'2026-10-11T14:00:00.000Z');
  }
});
