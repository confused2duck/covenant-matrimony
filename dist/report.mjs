// Local PDF generation: no upload, remote service or CDN is involved.
let libraryPromise;
function loadPdfLibrary() {
  if (globalThis.PDFLib) return Promise.resolve(globalThis.PDFLib);
  if (!libraryPromise) libraryPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = new URL('./vendor/pdf-lib.min.js', import.meta.url).href;
    script.onload = () => globalThis.PDFLib ? resolve(globalThis.PDFLib) : reject(new Error('PDF library did not load. Please try again.'));
    script.onerror = () => { libraryPromise = null; script.remove(); reject(new Error('The PDF could not be prepared. Please try again.')); };
    document.head.appendChild(script);
  });
  return libraryPromise;
}

export function summarizeReport(state) {
  const profiles = state.profiles || [], cases = state.cases || [];
  const count = (field, value) => profiles.filter(p => p[field] === value).length;
  return {
    total: profiles.length,
    approved: count('status', 'Approved'),
    introductions: cases.length,
    pendingAssignments: cases.filter(c => !c.coordinator).length,
    assigned: cases.filter(c => !!c.coordinator).length,
    routes: [['Online', 'online'], ['Branch', 'branch'], ['Church', 'church']].map(([label, value]) => [label, count('route', value)]),
    statuses: ['Approved', 'Under review', 'Awaiting consent', 'Changes requested', 'Suspended'].map(label => [label, count('status', label)]),
    states: ['Karnataka', 'Kerala', 'Tamil Nadu', 'Andhra Pradesh', 'Telangana'].map(label => [label, count('state', label)]),
    organisations: (state.organisations || []).filter(o => o.status === 'Active').length,
    appointments: (state.appointments || []).length,
    openTasks: (state.tasks || []).filter(t => !t.done).length
  };
}

export async function createAggregateReport(state, {pdfLib, generatedAt = new Date()} = {}) {
  const {PDFDocument, StandardFonts, rgb} = pdfLib || await loadPdfLibrary();
  const report = summarizeReport(state);
  const document = await PDFDocument.create();
  document.setTitle('Covenant Matrimony | Aggregate Report');
  document.setAuthor('Covenant Matrimony');
  document.setSubject('Current aggregate totals from the fictional demonstration workspace');
  document.setCreationDate(generatedAt);
  document.setModificationDate(generatedAt);
  const [regular, bold, serif] = await Promise.all([
    document.embedFont(StandardFonts.Helvetica),
    document.embedFont(StandardFonts.HelveticaBold),
    document.embedFont(StandardFonts.TimesRoman)
  ]);
  const page = document.addPage([595.28, 841.89]);
  const green = rgb(.09, .24, .20), ink = rgb(.16, .23, .19), muted = rgb(.32, .39, .33);
  const ivory = rgb(.973, .965, .938), paper = rgb(1, .995, .976), gold = rgb(.79, .71, .56), rule = rgb(.82, .85, .79);
  const text = (value, x, y, size = 11, font = regular, color = ink) => page.drawText(String(value), {x, y, size, font, color});
  const rect = (x, y, width, height, color, borderColor) => page.drawRectangle({x, y, width, height, color, ...(borderColor ? {borderColor, borderWidth:.6} : {})});
  const line = (x, y, width) => page.drawLine({start:{x,y}, end:{x:x+width,y}, color:rule, thickness:.6});
  const rightText = (value, right, y, size = 11, font = bold, color = ink) => text(value, right - font.widthOfTextAtSize(String(value),size), y, size, font, color);

  rect(0, 0, 595.28, 841.89, ivory);
  rect(0, 675, 595.28, 167, green);
  text('C O V E N A N T   /   M A T R I M O N Y', 42, 798, 10, bold, gold);
  text('A clear view of the work.', 42, 755, 28, serif, ivory);
  text('Aggregate report', 42, 727, 13, regular, ivory);
  text('DEMO DATA', 442, 798, 10, bold, gold);
  const date = generatedAt.toISOString().replace('T',' ').slice(0,16) + ' UTC';
  text('Generated ' + date, 42, 698, 10, regular, ivory);

  const cards = [['All profiles', report.total], ['Approved', report.approved], ['Introductions', report.introductions], ['Awaiting assignment', report.pendingAssignments]];
  cards.forEach(([label, value], i) => {
    const x = 42 + i * 130;
    rect(x, 556, 121, 89, paper, rule);
    text(label, x + 11, 624, label.length > 16 ? 9.5 : 10, regular, muted);
    text(value, x + 11, 585, 30, serif, green);
  });
  function bars(title, rows, x, y, width) {
    text(title, x, y, 14, bold, green);
    line(x, y - 13, width);
    rows.forEach(([label, value], i) => {
      const rowY = y - 41 - i * 39;
      text(label, x, rowY, 11, regular, muted);
      rightText(value, x + width, rowY, 11);
      rect(x, rowY - 12, width, 4, rule);
      if (value && report.total) rect(x, rowY - 12, width * value / report.total, 4, green);
    });
  }
  bars('Original intake routes', report.routes, 42, 522, 236);
  bars('Profile review stages', report.statuses, 310, 522, 243);
  text('Routes reflect the original registration channel.', 42, 351, 9, regular, muted);
  line(42, 300, 511);
  text('Profiles by state', 42, 275, 14, bold, green);
  report.states.forEach(([label, value], i) => {
    const y = 245 - i * 25;
    text(label, 42, y, 11, regular, muted);
    rightText(value, 278, y);
    line(42, y - 9, 236);
  });
  text('Coordination & operations', 310, 275, 14, bold, green);
  [['Assigned introductions', report.assigned], ['Awaiting assignment', report.pendingAssignments], ['Active organisations', report.organisations], ['Appointments', report.appointments], ['Open tasks', report.openTasks]].forEach(([label, value], i) => {
    const y = 245 - i * 25;
    text(label, 310, y, 11, regular, muted);
    rightText(value, 553, y);
    line(310, y - 9, 243);
  });
  line(42, 105, 511);
  text('Fictional demonstration data. Totals reflect the workspace at download time.', 42, 82, 10, regular, muted);
  text('Aggregate counts only; personal profile details are excluded.', 42, 64, 10, regular, muted);
  rightText('01', 553, 64, 10, bold, green);
  return document.save();
}
