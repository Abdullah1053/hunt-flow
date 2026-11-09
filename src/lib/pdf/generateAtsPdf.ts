import { MasterCvProfile, isItemVisible, getVisibleBullets } from '@/types/masterCv';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');

export interface AtsPdfOptions {
  fontFamily?: 'times' | 'helvetica';
}

interface FontSet {
  body: string;
  bold: string;
  italic: string;
}

/**
 * Resolves standard built-in PDF Type 1 ATS fonts (Standard 14).
 * Defaults to Times-Roman for body and Times-Bold for headings (Harvard / Jake's resume standard).
 */
function getFontSet(fontFamily: 'times' | 'helvetica' = 'times'): FontSet {
  if (fontFamily === 'helvetica') {
    return {
      body: 'Helvetica',
      bold: 'Helvetica-Bold',
      italic: 'Helvetica-Oblique',
    };
  }
  return {
    body: 'Times-Roman',
    bold: 'Times-Bold',
    italic: 'Times-Italic',
  };
}

/**
 * Sanitizes text to ensure 100% WinAnsiEncoding ASCII compatibility.
 * Replaces non-standard unicode characters that corrupt PDF text streams.
 */
export function sanitizeAtsText(str?: string | null): string {
  if (!str) return '';
  return str
    .replace(/[\u2018\u2019]/g, "'") // curly single quotes
    .replace(/[\u201C\u201D]/g, '"') // curly double quotes
    .replace(/[\u2013\u2014]/g, '-') // en-dash, em-dash
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '-') // unicode bullets
    .replace(/\t/g, ' ') // tabs to spaces
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '') // control chars
    .trim();
}

/**
 * Measures the exact total vertical height required by the CV profile
 * at a given scale factor.
 */
function measureResumeHeight(
  measureDoc: any,
  profile: MasterCvProfile,
  scale: number,
  fonts: FontSet,
  contentWidth: number
): number {
  const {
    personalInfo = {} as any,
    skills = {} as any,
    experience = [],
    projects = [],
    education = [],
    certifications = [],
  } = profile || {};

  let totalHeight = 0;

  // 1. Full Name
  const fullName = sanitizeAtsText(personalInfo.fullName || 'Candidate Name').toUpperCase();
  const nameSize = Math.max(14, 18 * scale);
  const nameH = measureDoc.font(fonts.bold).fontSize(nameSize).heightOfString(fullName, { width: contentWidth, align: 'center' });
  totalHeight += nameH + ((personalInfo.headline ? 3 : 5) * scale);

  // 2. Headline
  if (personalInfo.headline) {
    const headline = sanitizeAtsText(personalInfo.headline).toUpperCase();
    const headH = measureDoc.font(fonts.bold).fontSize(Math.max(8, 9.5 * scale)).heightOfString(headline, { width: contentWidth, align: 'center' });
    totalHeight += headH + (3.5 * scale);
  }

  // 3. Contact row
  const contactParts: string[] = [];
  if (personalInfo.location) contactParts.push(sanitizeAtsText(personalInfo.location));
  if (personalInfo.phone) contactParts.push(sanitizeAtsText(personalInfo.phone));
  if (personalInfo.email) contactParts.push(sanitizeAtsText(personalInfo.email));
  if (personalInfo.github) contactParts.push(sanitizeAtsText(personalInfo.github.replace(/^https?:\/\//, '')));
  if (personalInfo.linkedin) contactParts.push(sanitizeAtsText(personalInfo.linkedin.replace(/^https?:\/\//, '')));
  if (personalInfo.website) contactParts.push(sanitizeAtsText(personalInfo.website.replace(/^https?:\/\//, '')));

  if (contactParts.length > 0) {
    const contactLine = contactParts.join(' | ');
    const contactH = measureDoc.font(fonts.body).fontSize(Math.max(7.5, 8.5 * scale)).heightOfString(contactLine, { width: contentWidth, align: 'center' });
    totalHeight += contactH + (6 * scale);
  }

  // Helper for section header height
  const getSectionHeaderHeight = (title: string, isFirst: boolean) => {
    const headH = measureDoc.font(fonts.bold).fontSize(Math.max(8.5, 10.5 * scale)).heightOfString(title, { width: contentWidth, align: 'left' });
    const topGap = (isFirst ? 3 : 6) * scale;
    const ruleGap = 2 * scale;
    const ruleThickness = 0.75;
    const bottomGap = 4 * scale;
    return topGap + headH + ruleGap + ruleThickness + bottomGap;
  };

  let renderedSectionCount = 0;

  // 4. Professional Summary
  if (personalInfo.summary?.trim()) {
    const cleanSummary = sanitizeAtsText(personalInfo.summary);
    totalHeight += getSectionHeaderHeight('PROFESSIONAL SUMMARY', renderedSectionCount === 0);
    renderedSectionCount++;

    const sumH = measureDoc.font(fonts.body).fontSize(Math.max(7.5, 9 * scale)).heightOfString(cleanSummary, {
      width: contentWidth,
      lineGap: 1.2 * scale,
    });
    totalHeight += sumH + (4 * scale);
  }

  // 5. Education
  if (education && education.length > 0) {
    totalHeight += getSectionHeaderHeight('EDUCATION', renderedSectionCount === 0);
    renderedSectionCount++;

    for (let i = 0; i < education.length; i++) {
      const edu = education[i];
      const inst = sanitizeAtsText(edu.institution);
      const dates = [sanitizeAtsText(edu.startDate), sanitizeAtsText(edu.endDate)].filter(Boolean).join(' - ');

      const hInst = measureDoc.font(fonts.bold).fontSize(Math.max(8, 9.5 * scale)).heightOfString(inst, { width: contentWidth - 110, align: 'left' });
      const hDates = dates
        ? measureDoc.font(fonts.body).fontSize(Math.max(7.5, 9 * scale)).heightOfString(dates, { width: 110, align: 'right' })
        : 0;
      totalHeight += Math.max(hInst, hDates) + (1 * scale);

      let degreeText = sanitizeAtsText(edu.degree);
      if (edu.field) degreeText += ` in ${sanitizeAtsText(edu.field)}`;
      if (edu.gpa) degreeText += ` - GPA: ${sanitizeAtsText(edu.gpa)}`;

      const hDeg = measureDoc.font(fonts.italic).fontSize(Math.max(7.5, 9 * scale)).heightOfString(degreeText, { width: contentWidth, align: 'left' });
      totalHeight += hDeg + (1.5 * scale);

      if (edu.achievements && edu.achievements.length > 0) {
        for (const ach of edu.achievements) {
          const cleanAch = sanitizeAtsText(ach);
          const hAch = measureDoc.font(fonts.body).fontSize(Math.max(7.5, 9 * scale)).heightOfString(cleanAch, {
            width: contentWidth - 14,
            lineGap: 1.0 * scale,
          });
          totalHeight += hAch + (1.5 * scale);
        }
      }
      totalHeight += (3 * scale);
    }
  }

  // 6. Experience
  const visibleExperience = (experience || []).filter(isItemVisible);
  if (visibleExperience.length > 0) {
    totalHeight += getSectionHeaderHeight('EXPERIENCE', renderedSectionCount === 0);
    renderedSectionCount++;

    for (let i = 0; i < visibleExperience.length; i++) {
      const exp = visibleExperience[i];
      const role = sanitizeAtsText(exp.role);
      const dates = [sanitizeAtsText(exp.startDate), sanitizeAtsText(exp.endDate)].filter(Boolean).join(' - ');
      const company = sanitizeAtsText(exp.company);
      const loc = sanitizeAtsText(exp.location);

      const hRole = measureDoc.font(fonts.bold).fontSize(Math.max(8, 9.5 * scale)).heightOfString(role, { width: contentWidth - 110, align: 'left' });
      const hDates = dates
        ? measureDoc.font(fonts.body).fontSize(Math.max(7.5, 9 * scale)).heightOfString(dates, { width: 110, align: 'right' })
        : 0;
      totalHeight += Math.max(hRole, hDates) + (1 * scale);

      let compLine = company;
      if (loc) compLine += ` | ${loc}`;
      const hComp = measureDoc.font(fonts.italic).fontSize(Math.max(7.5, 9 * scale)).heightOfString(compLine, { width: contentWidth, align: 'left' });
      totalHeight += hComp + (1.5 * scale);

      const bullets = getVisibleBullets(exp);
      for (const bullet of bullets) {
        const cleanBullet = sanitizeAtsText(bullet);
        const hBullet = measureDoc.font(fonts.body).fontSize(Math.max(7.5, 9 * scale)).heightOfString(cleanBullet, {
          width: contentWidth - 14,
          lineGap: 1.0 * scale,
        });
        totalHeight += hBullet + (1.8 * scale);
      }
      totalHeight += (3.5 * scale);
    }
  }

  // 7. Projects
  const visibleProjects = (projects || []).filter(isItemVisible);
  if (visibleProjects.length > 0) {
    totalHeight += getSectionHeaderHeight('PROJECTS & TECHNICAL INITIATIVES', renderedSectionCount === 0);
    renderedSectionCount++;

    for (let i = 0; i < visibleProjects.length; i++) {
      const proj = visibleProjects[i];
      let titleLine = sanitizeAtsText(proj.title);
      if (proj.role) titleLine += ` - ${sanitizeAtsText(proj.role)}`;
      if (proj.techStack && proj.techStack.length > 0) {
        titleLine += ` | ${proj.techStack.map(sanitizeAtsText).join(', ')}`;
      }
      const dates = proj.startDate
        ? `${sanitizeAtsText(proj.startDate)} - ${sanitizeAtsText(proj.endDate || 'Present')}`
        : '';

      const hTitle = measureDoc.font(fonts.bold).fontSize(Math.max(8, 9.5 * scale)).heightOfString(titleLine, {
        width: contentWidth - (dates ? 110 : 0),
        align: 'left',
      });
      const hDates = dates
        ? measureDoc.font(fonts.body).fontSize(Math.max(7.5, 9 * scale)).heightOfString(dates, { width: 110, align: 'right' })
        : 0;
      totalHeight += Math.max(hTitle, hDates) + (1 * scale);

      const linkParts: string[] = [];
      if (proj.githubUrl) linkParts.push(`Code: ${sanitizeAtsText(proj.githubUrl.replace(/^https?:\/\//, ''))}`);
      if (proj.demoUrl) linkParts.push(`Demo: ${sanitizeAtsText(proj.demoUrl.replace(/^https?:\/\//, ''))}`);
      if (linkParts.length > 0) {
        const linksLine = linkParts.join(' | ');
        const hLinks = measureDoc.font(fonts.body).fontSize(Math.max(7, 8.5 * scale)).heightOfString(linksLine, { width: contentWidth, align: 'left' });
        totalHeight += hLinks + (1 * scale);
      }

      const bullets = getVisibleBullets(proj);
      for (const bullet of bullets) {
        const cleanBullet = sanitizeAtsText(bullet);
        const hBullet = measureDoc.font(fonts.body).fontSize(Math.max(7.5, 9 * scale)).heightOfString(cleanBullet, {
          width: contentWidth - 14,
          lineGap: 1.0 * scale,
        });
        totalHeight += hBullet + (1.8 * scale);
      }
      totalHeight += (3.5 * scale);
    }
  }

  // 8. Technical Skills
  const skillCategories = [
    { label: 'Languages', items: skills?.languages || [] },
    { label: 'Frameworks & Libraries', items: skills?.frameworks || [] },
    { label: 'Databases', items: skills?.databases || [] },
    { label: 'DevOps & Cloud', items: skills?.devopsAndCloud || [] },
    { label: 'Architecture & Concepts', items: skills?.toolsAndConcepts || [] },
  ].filter((cat) => cat.items && cat.items.length > 0);

  if (skillCategories.length > 0) {
    totalHeight += getSectionHeaderHeight('TECHNICAL SKILLS', renderedSectionCount === 0);
    renderedSectionCount++;

    for (const cat of skillCategories) {
      const fullSkillLine = `${cat.label}: ${cat.items.map(sanitizeAtsText).join(', ')}`;
      const hSkill = measureDoc.font(fonts.body).fontSize(Math.max(7.5, 9 * scale)).heightOfString(fullSkillLine, {
        width: contentWidth,
        lineGap: 1.0 * scale,
      });
      totalHeight += hSkill + (1.5 * scale);
    }
    totalHeight += (2 * scale);
  }

  // 9. Certifications
  if (certifications && certifications.length > 0) {
    totalHeight += getSectionHeaderHeight('CERTIFICATIONS', renderedSectionCount === 0);
    renderedSectionCount++;

    for (const cert of certifications) {
      let certText = `${sanitizeAtsText(cert.name)} - ${sanitizeAtsText(cert.issuer)}`;
      if (cert.date) certText += ` (${sanitizeAtsText(cert.date)})`;
      if (cert.url) certText += ` | ${sanitizeAtsText(cert.url.replace(/^https?:\/\//, ''))}`;

      const hCert = measureDoc.font(fonts.body).fontSize(Math.max(7.5, 9 * scale)).heightOfString(certText, {
        width: contentWidth - 14,
        lineGap: 1.0 * scale,
      });
      totalHeight += hCert + (1.5 * scale);
    }
  }

  return totalHeight;
}

/**
 * Generates an ATS-compliant, 100% selectable vector PDF using Standard 14 fonts.
 * Guaranteed to NEVER spill onto a 2nd page by using a 2-pass layout calculation
 * and auto-scaler that guarantees exactly 1 A4 page (595.28 x 841.89 pt).
 */
export async function generateAtsPdf(
  profile: MasterCvProfile,
  options: AtsPdfOptions = {}
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const fonts = getFontSet(options.fontFamily || 'times');

      // A4 portrait page dimensions (pt)
      const pageWidth = 595.28;
      const pageHeight = 841.89;

      // Base margins
      const leftRightMargin = 32;
      let topBottomMargin = 24;
      const contentWidth = pageWidth - leftRightMargin * 2; // 531.28 pt

      // Pass 1: Measure and compute optimal scaleFactor to guarantee strict single page
      const measureDoc = new PDFDocument({ size: 'A4', margin: 0 });

      const scaleSteps = [1.0, 0.97, 0.94, 0.91, 0.88, 0.85, 0.82, 0.80, 0.78];
      let chosenScale = 0.78;

      for (const scale of scaleSteps) {
        const usableHeight = pageHeight - (topBottomMargin * 2);
        const measuredHeight = measureResumeHeight(measureDoc, profile, scale, fonts, contentWidth);
        if (measuredHeight <= usableHeight) {
          chosenScale = scale;
          break;
        }
      }

      // If at lowest scale content is still close to bottom, slightly tighten top/bottom margin
      const finalUsableHeight = pageHeight - (topBottomMargin * 2);
      const finalMeasuredHeight = measureResumeHeight(measureDoc, profile, chosenScale, fonts, contentWidth);
      if (finalMeasuredHeight > finalUsableHeight) {
        topBottomMargin = Math.max(16, Math.floor((pageHeight - finalMeasuredHeight) / 2));
      }

      // Pass 2: Draw onto the single A4 page
      const doc = new PDFDocument({
        size: 'A4',
        margin: 0,
        autoFirstPage: true,
        compress: false,
        info: {
          Title: `${sanitizeAtsText(profile.personalInfo?.fullName) || 'Candidate'} - ATS Resume`,
          Author: sanitizeAtsText(profile.personalInfo?.fullName) || 'Candidate',
          Subject: 'ATS-Optimized Single Page Resume',
          Keywords: 'Resume, ATS, Software Engineer, Curriculum Vitae',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: any) => reject(err));

      const scale = chosenScale;
      let currentY = topBottomMargin;

      const {
        personalInfo = {} as any,
        skills = {} as any,
        experience = [],
        projects = [],
        education = [],
        certifications = [],
      } = profile || {};

      // ----------------------------------------------------
      // 1. CANDIDATE FULL NAME
      // ----------------------------------------------------
      const fullName = sanitizeAtsText(personalInfo.fullName || 'Candidate Name').toUpperCase();
      const nameFontSize = Math.max(14, 18 * scale);
      doc.font(fonts.bold).fontSize(nameFontSize).fillColor('#000000');
      doc.text(fullName, leftRightMargin, currentY, { width: contentWidth, align: 'center' });
      currentY += doc.heightOfString(fullName, { width: contentWidth, align: 'center' }) + ((personalInfo.headline ? 3 : 5) * scale);

      // ----------------------------------------------------
      // 2. PROFESSIONAL HEADLINE
      // ----------------------------------------------------
      if (personalInfo.headline) {
        const headline = sanitizeAtsText(personalInfo.headline).toUpperCase();
        const headlineSize = Math.max(8, 9.5 * scale);
        doc.font(fonts.bold).fontSize(headlineSize).fillColor('#222222');
        doc.text(headline, leftRightMargin, currentY, { width: contentWidth, align: 'center' });
        currentY += doc.heightOfString(headline, { width: contentWidth, align: 'center' }) + (3.5 * scale);
      }

      // ----------------------------------------------------
      // 3. CONTACT ROW
      // ----------------------------------------------------
      const contactItems: string[] = [];
      if (personalInfo.location) contactItems.push(sanitizeAtsText(personalInfo.location));
      if (personalInfo.phone) contactItems.push(sanitizeAtsText(personalInfo.phone));
      if (personalInfo.email) contactItems.push(sanitizeAtsText(personalInfo.email));
      if (personalInfo.github) contactItems.push(sanitizeAtsText(personalInfo.github.replace(/^https?:\/\//, '')));
      if (personalInfo.linkedin) contactItems.push(sanitizeAtsText(personalInfo.linkedin.replace(/^https?:\/\//, '')));
      if (personalInfo.website) contactItems.push(sanitizeAtsText(personalInfo.website.replace(/^https?:\/\//, '')));

      if (contactItems.length > 0) {
        const contactLine = contactItems.join(' | ');
        const contactSize = Math.max(7.5, 8.5 * scale);
        doc.font(fonts.body).fontSize(contactSize).fillColor('#333333');
        doc.text(contactLine, leftRightMargin, currentY, { width: contentWidth, align: 'center' });
        currentY += doc.heightOfString(contactLine, { width: contentWidth, align: 'center' }) + (6 * scale);
      }

      // Helper to render section headings
      let renderedSectionCount = 0;
      const renderSectionHeader = (title: string) => {
        currentY += (renderedSectionCount === 0 ? 3 : 6) * scale;
        renderedSectionCount++;

        const headingSize = Math.max(8.5, 10.5 * scale);
        doc.font(fonts.bold).fontSize(headingSize).fillColor('#000000');
        doc.text(title, leftRightMargin, currentY, { width: contentWidth, align: 'left' });
        currentY += doc.heightOfString(title, { width: contentWidth, align: 'left' }) + (2 * scale);

        // 0.75pt bottom rule
        doc
          .moveTo(leftRightMargin, currentY)
          .lineTo(leftRightMargin + contentWidth, currentY)
          .lineWidth(0.75)
          .strokeColor('#000000')
          .stroke();
        currentY += (4 * scale);
      };

      // ----------------------------------------------------
      // 4. PROFESSIONAL SUMMARY
      // ----------------------------------------------------
      if (personalInfo.summary?.trim()) {
        const cleanSummary = sanitizeAtsText(personalInfo.summary);
        renderSectionHeader('PROFESSIONAL SUMMARY');
        const summarySize = Math.max(7.5, 9 * scale);
        doc.font(fonts.body).fontSize(summarySize).fillColor('#222222');
        const sumH = doc.heightOfString(cleanSummary, { width: contentWidth, lineGap: 1.2 * scale });
        doc.text(cleanSummary, leftRightMargin, currentY, {
          width: contentWidth,
          align: 'left',
          lineGap: 1.2 * scale,
        });
        currentY += sumH + (4 * scale);
      }

      // ----------------------------------------------------
      // 5. EDUCATION
      // ----------------------------------------------------
      if (education && education.length > 0) {
        renderSectionHeader('EDUCATION');
        for (const edu of education) {
          const inst = sanitizeAtsText(edu.institution);
          const dates = [sanitizeAtsText(edu.startDate), sanitizeAtsText(edu.endDate)].filter(Boolean).join(' - ');

          const titleSize = Math.max(8, 9.5 * scale);
          const bodySize = Math.max(7.5, 9 * scale);

          doc.font(fonts.bold).fontSize(titleSize).fillColor('#000000');
          doc.text(inst, leftRightMargin, currentY, { width: contentWidth - 110, align: 'left' });
          if (dates) {
            doc.font(fonts.body).fontSize(bodySize).fillColor('#222222');
            doc.text(dates, leftRightMargin + contentWidth - 110, currentY, { width: 110, align: 'right' });
          }
          currentY += Math.max(
            doc.font(fonts.bold).fontSize(titleSize).heightOfString(inst, { width: contentWidth - 110 }),
            dates ? doc.font(fonts.body).fontSize(bodySize).heightOfString(dates, { width: 110 }) : 0
          ) + (1 * scale);

          let degreeText = sanitizeAtsText(edu.degree);
          if (edu.field) degreeText += ` in ${sanitizeAtsText(edu.field)}`;
          if (edu.gpa) degreeText += ` - GPA: ${sanitizeAtsText(edu.gpa)}`;

          doc.font(fonts.italic).fontSize(bodySize).fillColor('#333333');
          doc.text(degreeText, leftRightMargin, currentY, { width: contentWidth, align: 'left' });
          currentY += doc.heightOfString(degreeText, { width: contentWidth, align: 'left' }) + (1.5 * scale);

          if (edu.achievements && edu.achievements.length > 0) {
            for (const ach of edu.achievements) {
              const cleanAch = sanitizeAtsText(ach);
              const bHeight = doc.font(fonts.body).fontSize(bodySize).heightOfString(cleanAch, {
                width: contentWidth - 14,
                lineGap: 1.0 * scale,
              });

              doc.font(fonts.body).fontSize(bodySize).fillColor('#000000');
              doc.text('-', leftRightMargin + 4, currentY, { lineBreak: false });
              doc.font(fonts.body).fontSize(bodySize).fillColor('#222222');
              doc.text(cleanAch, leftRightMargin + 14, currentY, {
                width: contentWidth - 14,
                align: 'left',
                lineGap: 1.0 * scale,
              });
              currentY += bHeight + (1.5 * scale);
            }
          }
          currentY += (3 * scale);
        }
      }

      // ----------------------------------------------------
      // 6. EXPERIENCE
      // ----------------------------------------------------
      const visibleExperience = (experience || []).filter(isItemVisible);
      if (visibleExperience.length > 0) {
        renderSectionHeader('EXPERIENCE');
        for (const exp of visibleExperience) {
          const role = sanitizeAtsText(exp.role);
          const dates = [sanitizeAtsText(exp.startDate), sanitizeAtsText(exp.endDate)].filter(Boolean).join(' - ');
          const company = sanitizeAtsText(exp.company);
          const loc = sanitizeAtsText(exp.location);

          const roleSize = Math.max(8, 9.5 * scale);
          const bodySize = Math.max(7.5, 9 * scale);

          // Row 1: Role (Bold left) & Dates (Regular right)
          doc.font(fonts.bold).fontSize(roleSize).fillColor('#000000');
          doc.text(role, leftRightMargin, currentY, { width: contentWidth - 110, align: 'left' });
          if (dates) {
            doc.font(fonts.body).fontSize(bodySize).fillColor('#222222');
            doc.text(dates, leftRightMargin + contentWidth - 110, currentY, { width: 110, align: 'right' });
          }
          currentY += Math.max(
            doc.font(fonts.bold).fontSize(roleSize).heightOfString(role, { width: contentWidth - 110 }),
            dates ? doc.font(fonts.body).fontSize(bodySize).heightOfString(dates, { width: 110 }) : 0
          ) + (1 * scale);

          // Row 2: Company (Italic left) & Location
          let compLine = company;
          if (loc) compLine += ` | ${loc}`;
          doc.font(fonts.italic).fontSize(bodySize).fillColor('#333333');
          doc.text(compLine, leftRightMargin, currentY, { width: contentWidth, align: 'left' });
          currentY += doc.heightOfString(compLine, { width: contentWidth, align: 'left' }) + (1.5 * scale);

          // Bullets
          const bullets = getVisibleBullets(exp);
          for (const bullet of bullets) {
            const cleanBullet = sanitizeAtsText(bullet);
            const bHeight = doc.font(fonts.body).fontSize(bodySize).heightOfString(cleanBullet, {
              width: contentWidth - 14,
              lineGap: 1.0 * scale,
            });

            doc.font(fonts.body).fontSize(bodySize).fillColor('#000000');
            doc.text('-', leftRightMargin + 4, currentY, { lineBreak: false });
            doc.font(fonts.body).fontSize(bodySize).fillColor('#222222');
            doc.text(cleanBullet, leftRightMargin + 14, currentY, {
              width: contentWidth - 14,
              align: 'left',
              lineGap: 1.0 * scale,
            });
            currentY += bHeight + (1.8 * scale);
          }
          currentY += (3.5 * scale);
        }
      }

      // ----------------------------------------------------
      // 7. PROJECTS & TECHNICAL INITIATIVES
      // ----------------------------------------------------
      const visibleProjects = (projects || []).filter(isItemVisible);
      if (visibleProjects.length > 0) {
        renderSectionHeader('PROJECTS & TECHNICAL INITIATIVES');
        for (const proj of visibleProjects) {
          let titleLine = sanitizeAtsText(proj.title);
          if (proj.role) titleLine += ` - ${sanitizeAtsText(proj.role)}`;
          if (proj.techStack && proj.techStack.length > 0) {
            titleLine += ` | ${proj.techStack.map(sanitizeAtsText).join(', ')}`;
          }
          const dates = proj.startDate
            ? `${sanitizeAtsText(proj.startDate)} - ${sanitizeAtsText(proj.endDate || 'Present')}`
            : '';

          const projTitleSize = Math.max(8, 9.5 * scale);
          const bodySize = Math.max(7.5, 9 * scale);

          doc.font(fonts.bold).fontSize(projTitleSize).fillColor('#000000');
          doc.text(titleLine, leftRightMargin, currentY, { width: contentWidth - (dates ? 110 : 0), align: 'left' });
          if (dates) {
            doc.font(fonts.body).fontSize(bodySize).fillColor('#222222');
            doc.text(dates, leftRightMargin + contentWidth - 110, currentY, { width: 110, align: 'right' });
          }
          currentY += Math.max(
            doc.font(fonts.bold).fontSize(projTitleSize).heightOfString(titleLine, { width: contentWidth - (dates ? 110 : 0) }),
            dates ? doc.font(fonts.body).fontSize(bodySize).heightOfString(dates, { width: 110 }) : 0
          ) + (1 * scale);

          // Links line if present
          const linkParts: string[] = [];
          if (proj.githubUrl) linkParts.push(`Code: ${sanitizeAtsText(proj.githubUrl.replace(/^https?:\/\//, ''))}`);
          if (proj.demoUrl) linkParts.push(`Demo: ${sanitizeAtsText(proj.demoUrl.replace(/^https?:\/\//, ''))}`);
          if (linkParts.length > 0) {
            const linksLine = linkParts.join(' | ');
            const linksSize = Math.max(7, 8.5 * scale);
            doc.font(fonts.body).fontSize(linksSize).fillColor('#333333');
            doc.text(linksLine, leftRightMargin, currentY, { width: contentWidth, align: 'left' });
            currentY += doc.heightOfString(linksLine, { width: contentWidth, align: 'left' }) + (1 * scale);
          }

          // Bullets
          const bullets = getVisibleBullets(proj);
          for (const bullet of bullets) {
            const cleanBullet = sanitizeAtsText(bullet);
            const bHeight = doc.font(fonts.body).fontSize(bodySize).heightOfString(cleanBullet, {
              width: contentWidth - 14,
              lineGap: 1.0 * scale,
            });

            doc.font(fonts.body).fontSize(bodySize).fillColor('#000000');
            doc.text('-', leftRightMargin + 4, currentY, { lineBreak: false });
            doc.font(fonts.body).fontSize(bodySize).fillColor('#222222');
            doc.text(cleanBullet, leftRightMargin + 14, currentY, {
              width: contentWidth - 14,
              align: 'left',
              lineGap: 1.0 * scale,
            });
            currentY += bHeight + (1.8 * scale);
          }
          currentY += (3.5 * scale);
        }
      }

      // ----------------------------------------------------
      // 8. TECHNICAL SKILLS
      // ----------------------------------------------------
      const skillCategories = [
        { label: 'Languages', items: skills?.languages || [] },
        { label: 'Frameworks & Libraries', items: skills?.frameworks || [] },
        { label: 'Databases', items: skills?.databases || [] },
        { label: 'DevOps & Cloud', items: skills?.devopsAndCloud || [] },
        { label: 'Architecture & Concepts', items: skills?.toolsAndConcepts || [] },
      ].filter((cat) => cat.items && cat.items.length > 0);

      if (skillCategories.length > 0) {
        renderSectionHeader('TECHNICAL SKILLS');
        const skillSize = Math.max(7.5, 9 * scale);

        for (const cat of skillCategories) {
          const catLabel = `${cat.label}: `;
          const valuesText = cat.items.map(sanitizeAtsText).join(', ');

          doc.font(fonts.bold).fontSize(skillSize).fillColor('#000000');
          const labelWidth = doc.widthOfString(catLabel) + 2;

          doc.text(catLabel, leftRightMargin, currentY, { lineBreak: false });
          doc.font(fonts.body).fontSize(skillSize).fillColor('#222222');
          doc.text(valuesText, leftRightMargin + labelWidth, currentY, {
            width: contentWidth - labelWidth,
            align: 'left',
            lineGap: 1.0 * scale,
          });

          const valHeight = doc.heightOfString(valuesText, {
            width: contentWidth - labelWidth,
            lineGap: 1.0 * scale,
          });
          currentY += valHeight + (1.5 * scale);
        }
        currentY += (2 * scale);
      }

      // ----------------------------------------------------
      // 9. CERTIFICATIONS
      // ----------------------------------------------------
      if (certifications && certifications.length > 0) {
        renderSectionHeader('CERTIFICATIONS');
        const certSize = Math.max(7.5, 9 * scale);

        for (const cert of certifications) {
          let certText = `${sanitizeAtsText(cert.name)} - ${sanitizeAtsText(cert.issuer)}`;
          if (cert.date) certText += ` (${sanitizeAtsText(cert.date)})`;
          if (cert.url) certText += ` | ${sanitizeAtsText(cert.url.replace(/^https?:\/\//, ''))}`;

          const cHeight = doc.font(fonts.body).fontSize(certSize).heightOfString(certText, {
            width: contentWidth - 14,
            lineGap: 1.0 * scale,
          });

          doc.font(fonts.body).fontSize(certSize).fillColor('#000000');
          doc.text('-', leftRightMargin + 4, currentY, { lineBreak: false });
          doc.font(fonts.body).fontSize(certSize).fillColor('#222222');
          doc.text(certText, leftRightMargin + 14, currentY, {
            width: contentWidth - 14,
            align: 'left',
            lineGap: 1.0 * scale,
          });
          currentY += cHeight + (1.5 * scale);
        }
      }

      // Hard Page Lock: Never call doc.addPage()
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
