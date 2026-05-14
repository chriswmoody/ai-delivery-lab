import pptxgen from 'pptxgenjs'

// ── Design tokens ──────────────────────────────────────────────
const C = {
  ink:       '0C0A09',
  cream:     'FAF9F7',
  sand:      'F0EDE8',
  mint:      '7DD4BD',
  mintLight: 'E8F7F3',
  sky:       '7AAFD4',
  skyLight:  'EBF4FB',
  peach:     'E8A880',
  peachLight:'FDF3EC',
  slate:     '4A4540',
  mist:      'C8C2BC',
  border:    'E8E4DF',
  white:     'FFFFFF',
  mintDark:  '2D6B5E',
  skyDark:   '2A5270',
  peachDark: '7A4A28',
  red:       'DC5050',
}

const HEALTH_CONFIG = {
  'ON TRACK':  { label: 'ON TRACK',  accent: C.mint,  labelBg: C.mintLight,  labelColor: C.mintDark  },
  'AT RISK':   { label: 'AT RISK',   accent: C.peach, labelBg: C.peachLight, labelColor: C.peachDark },
  'OFF TRACK': { label: 'OFF TRACK', accent: C.red,   labelBg: 'FDECEA',     labelColor: '8B2020'    },
}

// ── Helpers ────────────────────────────────────────────────────
function parseSections(text) {
  if (!text) return {}
  const lines = text.split('\n')
  const sections = {}
  let currentKey = null
  let currentBody = []
  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentKey) sections[currentKey] = currentBody.join('\n').trim()
      currentKey = line.replace('## ', '').trim()
      currentBody = []
    } else if (currentKey) {
      currentBody.push(line)
    }
  }
  if (currentKey) sections[currentKey] = currentBody.join('\n').trim()
  return sections
}

function getHealth(sections) {
  const raw = (sections['HEALTH STATUS'] || '').trim()
  if (raw.startsWith('ON TRACK'))  return 'ON TRACK'
  if (raw.startsWith('AT RISK'))   return 'AT RISK'
  if (raw.startsWith('OFF TRACK')) return 'OFF TRACK'
  return 'AT RISK'
}

function getHealthSentence(sections) {
  const raw = (sections['HEALTH STATUS'] || '').trim()
  const lines = raw.split('\n').filter(l => l.trim())
  return lines.length > 1 ? lines.slice(1).join(' ').trim() : ''
}

function cleanText(text) {
  return (text || '')
    .replace(/\*\*/g, '')
    .replace(/^[•\-]\s*/gm, '• ')
    .trim()
}

// Convert a prose or mixed block into bullet point lines, capped at maxBullets
function toBullets(text, maxBullets = 6) {
  const raw = (text || '').replace(/\*\*/g, '')
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)

  const bullets = []
  for (const line of lines) {
    // Already a bullet or a labeled item (e.g. [RISK], [DECISION], **Area:**)
    const stripped = line.replace(/^[•\-\*]\s*/, '').replace(/^\[.*?\]\s*[—-]\s*/, '').trim()
    if (stripped) bullets.push(stripped)
    if (bullets.length >= maxBullets) break
  }

  return bullets.map(b => `• ${b}`).join('\n')
}

// For prose paragraphs (WHERE WE STAND, SUMMARY) — split sentences into bullets
function proseToBullets(text, maxBullets = 5) {
  const raw = (text || '').replace(/\*\*/g, '').trim()
  // If already bulleted, use toBullets
  if (/^[•\-\*]/m.test(raw)) return toBullets(raw, maxBullets)
  // Split on sentences
  const sentences = raw
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 10)
  return sentences.slice(0, maxBullets).map(s => `• ${s}`).join('\n')
}

// Truncate to roughly N lines worth of characters to avoid overflow
function truncateToLines(text, maxCharsPerLine, maxLines) {
  const lines = text.split('\n')
  const result = []
  let totalLines = 0
  for (const line of lines) {
    const wrappedLines = Math.ceil((line.length || 1) / maxCharsPerLine)
    if (totalLines + wrappedLines > maxLines) break
    result.push(line)
    totalLines += wrappedLines
  }
  return result.join('\n').trim()
}

function addFooter(slide, projectName, period) {
  slide.addText(`${projectName || 'Status Report'}  ·  ${period || ''}  ·  AI Delivery Lab`, {
    x: 0.4, y: 7.28, w: 12.5, h: 0.18,
    fontSize: 7.5, color: C.mist, fontFace: 'Calibri', align: 'center',
  })
}

// Light supporting slide (for full report)
function addSectionSlide(pptx, title, body, accentHex, projectName, period) {
  const slide = pptx.addSlide()
  slide.background = { color: C.white }

  // Top ink bar
  slide.addShape('rect', {
    x: 0, y: 0, w: 13.33, h: 0.6,
    fill: { color: C.ink }, line: { color: C.ink },
  })
  slide.addText(title, {
    x: 0.4, y: 0, w: 10, h: 0.6,
    fontSize: 11, bold: true, color: C.cream,
    fontFace: 'Calibri', charSpacing: 1.5, valign: 'middle',
  })

  // Left accent bar
  slide.addShape('rect', {
    x: 0, y: 0.6, w: 0.06, h: 6.7,
    fill: { color: accentHex }, line: { color: accentHex },
  })

  const bulleted = truncateToLines(toBullets(body, 10), 90, 14)
  slide.addText(bulleted, {
    x: 0.35, y: 0.85, w: 12.6, h: 6.3,
    fontSize: 13, color: C.ink, fontFace: 'Calibri',
    valign: 'top', wrap: true, lineSpacingMultiple: 1.55,
  })

  addFooter(slide, projectName, period)
  return slide
}

// ── Executive Update — single clean light slide ────────────────
export async function generateExecPptx({ output, projectName, audience, period }) {
  const sections = parseSections(output)
  const health   = getHealth(sections)
  const hc       = HEALTH_CONFIG[health]

  const healthSentence    = getHealthSentence(sections)

  // Convert all columns to capped bullets
  const whereWeStand      = truncateToLines(proseToBullets(sections['WHERE WE STAND'] || '', 5), 55, 12)
  const risksAndDecisions = truncateToLines(toBullets(sections['RISKS AND DECISIONS'] || '', 5), 55, 12)
  const theAsk            = truncateToLines(proseToBullets(sections['THE ASK'] || '', 3), 55, 6)

  const pptx = new pptxgen()
  pptx.layout = 'LAYOUT_WIDE'

  const slide = pptx.addSlide()
  slide.background = { color: C.white }

  // ── Header bar (ink) ──────────────────────────────────────
  slide.addShape('rect', {
    x: 0, y: 0, w: 13.33, h: 0.85,
    fill: { color: C.ink }, line: { color: C.ink },
  })
  slide.addText(projectName || 'Executive Update', {
    x: 0.4, y: 0, w: 8, h: 0.85,
    fontSize: 22, bold: true, color: C.white,
    fontFace: 'Calibri', valign: 'middle',
  })
  slide.addText(`${audience ? audience + '  ·  ' : ''}${period || ''}`, {
    x: 8.5, y: 0, w: 4.5, h: 0.85,
    fontSize: 10, color: C.mist, fontFace: 'Calibri',
    align: 'right', valign: 'middle',
  })

  // ── Health strip ──────────────────────────────────────────
  slide.addShape('rect', {
    x: 0, y: 0.85, w: 13.33, h: 0.5,
    fill: { color: C.sand }, line: { color: C.border },
  })
  // Health badge
  slide.addShape('roundRect', {
    x: 0.35, y: 0.96, w: 1.45, h: 0.28,
    fill: { color: hc.labelBg }, line: { color: hc.accent },
    rectRadius: 0.04,
  })
  slide.addText(hc.label, {
    x: 0.35, y: 0.96, w: 1.45, h: 0.28,
    fontSize: 8.5, bold: true, color: hc.labelColor,
    fontFace: 'Calibri', align: 'center', valign: 'middle',
  })
  if (healthSentence) {
    slide.addText(healthSentence, {
      x: 2.0, y: 0.96, w: 11.0, h: 0.28,
      fontSize: 10, color: C.slate, fontFace: 'Calibri',
      valign: 'middle', italic: true,
    })
  }

  // ── Three columns ─────────────────────────────────────────
  const colY = 1.48
  const colH = 5.6
  const cols = [
    { x: 0.25,  w: 4.08, label: 'WHERE WE STAND',   body: whereWeStand,      accent: C.mint,  labelColor: C.mintDark  },
    { x: 4.63,  w: 4.08, label: 'RISKS & DECISIONS', body: risksAndDecisions, accent: C.peach, labelColor: C.peachDark },
    { x: 9.0,   w: 4.08, label: 'THE ASK',           body: theAsk,            accent: C.sky,   labelColor: C.skyDark   },
  ]

  cols.forEach(col => {
    // Card: white fill, colored top border, light gray outline
    slide.addShape('roundRect', {
      x: col.x, y: colY, w: col.w, h: colH,
      fill: { color: C.white }, line: { color: C.border, pt: 1 },
      rectRadius: 0.08,
    })
    // Colored top accent bar
    slide.addShape('roundRect', {
      x: col.x, y: colY, w: col.w, h: 0.06,
      fill: { color: col.accent }, line: { color: col.accent },
      rectRadius: 0.08,
    })

    // Label
    slide.addText(col.label, {
      x: col.x + 0.2, y: colY + 0.12, w: col.w - 0.4, h: 0.28,
      fontSize: 8, bold: true, color: col.labelColor,
      fontFace: 'Calibri', charSpacing: 1.5, valign: 'middle',
    })
    // Divider
    slide.addShape('rect', {
      x: col.x + 0.2, y: colY + 0.44, w: col.w - 0.4, h: 0.015,
      fill: { color: C.border }, line: { color: C.border },
    })
    // Body
    slide.addText(col.body, {
      x: col.x + 0.2, y: colY + 0.55, w: col.w - 0.4, h: colH - 0.7,
      fontSize: 11.5, color: C.ink, fontFace: 'Calibri',
      valign: 'top', wrap: true, lineSpacingMultiple: 1.45,
    })
  })

  addFooter(slide, projectName, period)

  const filename = `${(projectName || 'status-update').toLowerCase().replace(/\s+/g, '-')}-exec-update.pptx`
  return pptx.writeFile({ fileName: filename })
}

// ── Full Status Report — dashboard + supporting slides ─────────
export async function generateFullPptx({ output, projectName, audience, period }) {
  const sections = parseSections(output)
  const health   = getHealth(sections)
  const hc       = HEALTH_CONFIG[health]

  const healthSentence = getHealthSentence(sections)

  // Raw for supporting slides (full bullets, capped at 10)
  const progressText = toBullets(sections['PROGRESS BY AREA'] || '', 10)
  const risksText    = toBullets(sections['RISKS AND BLOCKERS'] || '', 10)
  const whatsNext    = toBullets(sections["WHAT'S NEXT"] || '', 10)
  const theAsk       = proseToBullets(sections['THE ASK'] || '', 3)

  // Dashboard — summary as 2-3 sentence prose, cards as tight capped bullets
  const summary          = truncateToLines(proseToBullets(sections['SUMMARY'] || '', 2), 90, 4)
  const decisionsDisplay = truncateToLines(toBullets(sections['DECISIONS MADE'] || '', 4), 52, 10)
  const risksDisplay     = truncateToLines(toBullets(sections['RISKS AND BLOCKERS'] || '', 4), 52, 10)
  const nextDisplay      = truncateToLines(toBullets(sections["WHAT'S NEXT"] || '', 4), 52, 10)

  const pptx = new pptxgen()
  pptx.layout = 'LAYOUT_WIDE'

  // ── SLIDE 1: Dashboard ────────────────────────────────────────
  const s1 = pptx.addSlide()
  s1.background = { color: C.white }

  // Header bar
  s1.addShape('rect', {
    x: 0, y: 0, w: 13.33, h: 0.85,
    fill: { color: C.ink }, line: { color: C.ink },
  })
  s1.addText(projectName || 'Project Status Report', {
    x: 0.4, y: 0, w: 8.5, h: 0.85,
    fontSize: 22, bold: true, color: C.white, fontFace: 'Calibri', valign: 'middle',
  })
  s1.addText(`${audience ? audience + '  ·  ' : ''}${period || ''}`, {
    x: 8.9, y: 0, w: 4.1, h: 0.85,
    fontSize: 10, color: C.mist, fontFace: 'Calibri', align: 'right', valign: 'middle',
  })

  // Health strip
  s1.addShape('rect', {
    x: 0, y: 0.85, w: 13.33, h: 0.48,
    fill: { color: C.sand }, line: { color: C.border },
  })
  s1.addShape('roundRect', {
    x: 0.35, y: 0.94, w: 1.45, h: 0.28,
    fill: { color: hc.labelBg }, line: { color: hc.accent }, rectRadius: 0.04,
  })
  s1.addText(hc.label, {
    x: 0.35, y: 0.94, w: 1.45, h: 0.28,
    fontSize: 8.5, bold: true, color: hc.labelColor,
    fontFace: 'Calibri', align: 'center', valign: 'middle',
  })
  if (healthSentence) {
    s1.addText(healthSentence, {
      x: 2.0, y: 0.94, w: 11.0, h: 0.28,
      fontSize: 10, color: C.slate, fontFace: 'Calibri', valign: 'middle', italic: true,
    })
  }

  // Summary block (full width)
  s1.addShape('roundRect', {
    x: 0.25, y: 1.44, w: 12.83, h: 1.0,
    fill: { color: C.sand }, line: { color: C.border, pt: 1 }, rectRadius: 0.08,
  })
  s1.addShape('roundRect', {
    x: 0.25, y: 1.44, w: 12.83, h: 0.06,
    fill: { color: C.sky }, line: { color: C.sky }, rectRadius: 0.08,
  })
  s1.addText('SUMMARY', {
    x: 0.48, y: 1.52, w: 3, h: 0.22,
    fontSize: 7.5, bold: true, color: C.skyDark, fontFace: 'Calibri', charSpacing: 1.8,
  })
  s1.addText(summary, {
    x: 0.48, y: 1.76, w: 12.38, h: 0.62,
    fontSize: 11.5, color: C.ink, fontFace: 'Calibri',
    valign: 'top', wrap: true, lineSpacingMultiple: 1.35,
  })

  // Three bottom cards
  const cardY = 2.58
  const cardH = 4.3
  const cards = [
    { x: 0.25, w: 4.08, label: 'DECISIONS MADE',  body: decisionsDisplay, accent: C.mint,  labelColor: C.mintDark  },
    { x: 4.63, w: 4.08, label: 'RISKS & BLOCKERS', body: risksDisplay,     accent: C.peach, labelColor: C.peachDark },
    { x: 9.0,  w: 4.08, label: "WHAT'S NEXT",      body: nextDisplay,      accent: C.sky,   labelColor: C.skyDark   },
  ]

  cards.forEach(card => {
    s1.addShape('roundRect', {
      x: card.x, y: cardY, w: card.w, h: cardH,
      fill: { color: C.white }, line: { color: C.border, pt: 1 }, rectRadius: 0.08,
    })
    s1.addShape('roundRect', {
      x: card.x, y: cardY, w: card.w, h: 0.06,
      fill: { color: card.accent }, line: { color: card.accent }, rectRadius: 0.08,
    })
    s1.addText(card.label, {
      x: card.x + 0.2, y: cardY + 0.1, w: card.w - 0.4, h: 0.26,
      fontSize: 7.5, bold: true, color: card.labelColor, fontFace: 'Calibri', charSpacing: 1.5,
    })
    s1.addShape('rect', {
      x: card.x + 0.2, y: cardY + 0.4, w: card.w - 0.4, h: 0.015,
      fill: { color: C.border }, line: { color: C.border },
    })
    s1.addText(card.body, {
      x: card.x + 0.2, y: cardY + 0.52, w: card.w - 0.4, h: cardH - 0.65,
      fontSize: 11, color: C.ink, fontFace: 'Calibri',
      valign: 'top', wrap: true, lineSpacingMultiple: 1.4,
    })
  })

  addFooter(s1, projectName, period)

  // ── Supporting slides (light) ─────────────────────────────────
  const supporting = [
    { key: 'PROGRESS BY AREA',  body: progressText, accent: C.mint  },
    { key: 'RISKS AND BLOCKERS', body: risksText,   accent: C.peach },
    { key: "WHAT'S NEXT",        body: whatsNext,   accent: C.sky   },
  ]
  supporting.forEach(({ key, body, accent }) => {
    if (!body.trim()) return
    addSectionSlide(pptx, key, body, accent, projectName, period)
  })

  // ── The Ask slide (ink, centered) ────────────────────────────
  if (theAsk.trim()) {
    const askSlide = pptx.addSlide()
    askSlide.background = { color: C.ink }

    // Subtle mint accent line
    askSlide.addShape('rect', {
      x: 4.5, y: 2.8, w: 4.33, h: 0.04,
      fill: { color: C.peach }, line: { color: C.peach },
    })
    askSlide.addText('THE ASK', {
      x: 1.5, y: 2.0, w: 10.33, h: 0.4,
      fontSize: 10, bold: true, color: C.peach,
      fontFace: 'Calibri', charSpacing: 3, align: 'center',
    })
    askSlide.addText(theAsk, {
      x: 1.5, y: 2.9, w: 10.33, h: 2.2,
      fontSize: 22, color: C.white, fontFace: 'Calibri',
      align: 'center', valign: 'middle', wrap: true, lineSpacingMultiple: 1.5,
    })
    addFooter(askSlide, projectName, period)
  }

  const filename = `${(projectName || 'status-report').toLowerCase().replace(/\s+/g, '-')}-full-report.pptx`
  return pptx.writeFile({ fileName: filename })
}
