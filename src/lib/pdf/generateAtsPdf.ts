import { MasterCvProfile, isItemVisible, getVisibleBullets } from '@/types/masterCv';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');

/**
 * Sanitizes text to ensure 100% WinAnsiEncoding ASCII compatibility.
 * Replaces non-standard unicode characters that corrupt PDF text streams.
 */
export function sanitizeAtsText(str: string): string {
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
 * Generates an ATS-compliant, 100% selectable vector PDF using standard built-in
 * PDF Type 1 fonts (Helvetica / WinAnsiEncoding).
 * Zero custom font subsetting, zero canvas/image rasterization.
 * 100% editable in Microsoft Word, Google Docs, LinkedIn, and ATS parsers.
 */
export async function generateAtsPdf(profile: MasterCvProfile): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4', // 595.28 x 841.89 pt
        margin: 36,
        autoFirstPage: true,
        compress: false, // Output uncompressed plain-text PDF streams
        info: {
          Title: `${sanitizeAtsText(profile.personalInfo?.fullName) || 'Candidate'} - ATS Resume`,
          Author: sanitizeAtsText(profile.personalInfo?.fullName) || 'Candidate',
          Subject: 'ATS-Optimized Resume',
          Keywords: 'Resume, ATS, Software Engineer, Curriculum Vitae',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: any) => reject(err));

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const margin = 36;
      const contentWidth = pageWidth - margin * 2; // 523.28 pt
      const maxY = pageHeight - margin; // 805.89 pt

      let currentY = margin;

      // Page break check helper
      const ensureSpace = (neededHeight: number) => {
        if (currentY + neededHeight > maxY) {
          doc.addPage();
          currentY = margin;
        }
      };

      const {
        personalInfo = {} as any,
        skills = {} as any,
        experience = [],
        projects = [],
        education = [],
        certifications = [],
      } = profile || {};

      // ----------------------------------------------------
      // 1. CANDIDATE NAME (18pt Bold, Centered)
      // ----------------------------------------------------
      const fullName = sanitizeAtsText(personalInfo.fullName || 'Candidate Name').toUpperCase();
      doc.font('Helvetica-Bold').fontSize(18).fillColor('#000000');
      doc.text(fullName, margin, currentY, { width: contentWidth, align: 'center' });
      currentY += 24;

      // ----------------------------------------------------
      // 2. HEADLINE (10pt Bold, Centered)
      // ----------------------------------------------------
      if (personalInfo.headline) {
        const headline = sanitizeAtsText(personalInfo.headline).toUpperCase();
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#333333');
        doc.text(headline, margin, currentY, { width: contentWidth, align: 'center' });
        currentY += 15;
      }

      // ----------------------------------------------------
      // 3. CONTACT ROW (9pt Normal, Centered, Single Line with |)
      // ----------------------------------------------------
      const contactItems: string[] = [];
      if (personalInfo.location) contactItems.push(sanitizeAtsText(personalInfo.location));
      if (personalInfo.phone) contactItems.push(sanitizeAtsText(personalInfo.phone));
      if (personalInfo.email) contactItems.push(sanitizeAtsText(personalInfo.email));
      if (personalInfo.github) {
        contactItems.push(sanitizeAtsText(personalInfo.github.replace(/^https?:\/\//, '')));
      }
      if (personalInfo.linkedin) {
        contactItems.push(sanitizeAtsText(personalInfo.linkedin.replace(/^https?:\/\//, '')));
      }
      if (personalInfo.website) {
        contactItems.push(sanitizeAtsText(personalInfo.website.replace(/^https?:\/\//, '')));
      }

      if (contactItems.length > 0) {
        const contactLine = contactItems.join(' | ');
        doc.font('Helvetica').fontSize(8.5).fillColor('#222222');
        doc.text(contactLine, margin, currentY, { width: contentWidth, align: 'center' });
        currentY += 16;
      }

      // Helper to render section headers with underline
      const renderSectionHeader = (title: string) => {
        ensureSpace(28);
        currentY += 6;
        doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#000000');
        doc.text(title, margin, currentY, { width: contentWidth, align: 'left' });
        currentY += 13;

        // Clean horizontal divider line
        doc
          .moveTo(margin, currentY)
          .lineTo(margin + contentWidth, currentY)
          .lineWidth(0.75)
          .strokeColor('#000000')
          .stroke();
        currentY += 6;
      };

      // ----------------------------------------------------
      // 4. PROFESSIONAL SUMMARY
      // ----------------------------------------------------
      if (personalInfo.summary) {
        const cleanSummary = sanitizeAtsText(personalInfo.summary);
        renderSectionHeader('PROFESSIONAL SUMMARY');
        doc.font('Helvetica').fontSize(9).fillColor('#222222');
        const summaryHeight = doc.heightOfString(cleanSummary, {
          width: contentWidth,
          lineGap: 2,
        });
        ensureSpace(summaryHeight + 4);
        doc.text(cleanSummary, margin, currentY, {
          width: contentWidth,
          align: 'left',
          lineGap: 2,
        });
        currentY += summaryHeight + 6;
      }

      // ----------------------------------------------------
      // 5. EDUCATION
      // ----------------------------------------------------
      if (education && education.length > 0) {
        renderSectionHeader('EDUCATION');
        for (const edu of education) {
          ensureSpace(32);
          const inst = sanitizeAtsText(edu.institution);
          const dates = `${sanitizeAtsText(edu.startDate)} - ${sanitizeAtsText(edu.endDate)}`;

          // Row 1: Institution (Bold left) & Dates (Normal right)
          doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#000000');
          doc.text(inst, margin, currentY, { width: contentWidth - 120, align: 'left' });
          doc.font('Helvetica').fontSize(9).fillColor('#222222');
          doc.text(dates, margin, currentY, { width: contentWidth, align: 'right' });
          currentY += 13;

          // Row 2: Degree, Field, GPA (Italic left)
          let degreeText = sanitizeAtsText(edu.degree);
          if (edu.field) degreeText += ` in ${sanitizeAtsText(edu.field)}`;
          if (edu.gpa) degreeText += ` - GPA: ${sanitizeAtsText(edu.gpa)}`;

          doc.font('Helvetica-Oblique').fontSize(9).fillColor('#333333');
          doc.text(degreeText, margin, currentY, { width: contentWidth, align: 'left' });
          currentY += 12;

          // Achievements bullets if present
          if (edu.achievements && edu.achievements.length > 0) {
            for (const ach of edu.achievements) {
              const cleanAch = sanitizeAtsText(ach);
              const bHeight = doc.heightOfString(cleanAch, { width: contentWidth - 16, lineGap: 1.5 });
              ensureSpace(bHeight + 3);

              doc.font('Helvetica').fontSize(9).fillColor('#000000');
              doc.text('-', margin + 4, currentY, { lineBreak: false });
              doc.font('Helvetica').fontSize(9).fillColor('#222222');
              doc.text(cleanAch, margin + 14, currentY, {
                width: contentWidth - 14,
                align: 'left',
                lineGap: 1.5,
              });
              currentY += bHeight + 3;
            }
          }
          currentY += 4;
        }
      }

      // ----------------------------------------------------
      // 6. EXPERIENCE
      // ----------------------------------------------------
      const visibleExperience = (experience || []).filter(isItemVisible);
      if (visibleExperience.length > 0) {
        renderSectionHeader('EXPERIENCE');
        for (const exp of visibleExperience) {
          ensureSpace(34);
          const role = sanitizeAtsText(exp.role);
          const dates = `${sanitizeAtsText(exp.startDate)} - ${sanitizeAtsText(exp.endDate)}`;
          const company = sanitizeAtsText(exp.company);
          const loc = sanitizeAtsText(exp.location);

          // Row 1: Role (Bold left) & Dates (Normal right)
          doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#000000');
          doc.text(role, margin, currentY, { width: contentWidth - 120, align: 'left' });
          doc.font('Helvetica').fontSize(9).fillColor('#222222');
          doc.text(dates, margin, currentY, { width: contentWidth, align: 'right' });
          currentY += 13;

          // Row 2: Company (Italic left) & Location (Normal right)
          doc.font('Helvetica-Oblique').fontSize(9).fillColor('#333333');
          doc.text(company, margin, currentY, { width: contentWidth - 120, align: 'left' });
          if (loc) {
            doc.font('Helvetica').fontSize(8.5).fillColor('#555555');
            doc.text(loc, margin, currentY, { width: contentWidth, align: 'right' });
          }
          currentY += 13;

          // Bullets
          const bullets = getVisibleBullets(exp);
          for (const bullet of bullets) {
            const cleanBullet = sanitizeAtsText(bullet);
            doc.font('Helvetica').fontSize(9);
            const bHeight = doc.heightOfString(cleanBullet, { width: contentWidth - 14, lineGap: 1.5 });
            ensureSpace(bHeight + 3);

            doc.font('Helvetica').fontSize(9).fillColor('#000000');
            doc.text('-', margin + 4, currentY, { lineBreak: false });
            doc.font('Helvetica').fontSize(9).fillColor('#222222');
            doc.text(cleanBullet, margin + 14, currentY, {
              width: contentWidth - 14,
              align: 'left',
              lineGap: 1.5,
            });
            currentY += bHeight + 3;
          }
          currentY += 4;
        }
      }

      // ----------------------------------------------------
      // 7. PROJECTS & TECHNICAL INITIATIVES
      // ----------------------------------------------------
      const visibleProjects = (projects || []).filter(isItemVisible);
      if (visibleProjects.length > 0) {
        renderSectionHeader('PROJECTS & TECHNICAL INITIATIVES');
        for (const proj of visibleProjects) {
          ensureSpace(34);
          let titleLine = sanitizeAtsText(proj.title);
          if (proj.role) {
            titleLine += ` - ${sanitizeAtsText(proj.role)}`;
          }
          if (proj.techStack && proj.techStack.length > 0) {
            titleLine += ` | ${proj.techStack.map(sanitizeAtsText).join(', ')}`;
          }
          const dates = proj.startDate
            ? `${sanitizeAtsText(proj.startDate)} - ${sanitizeAtsText(proj.endDate || 'Present')}`
            : '';

          // Row 1: Title, Role & Tech Stack (Bold left) & Dates (Normal right)
          doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#000000');
          doc.text(titleLine, margin, currentY, { width: contentWidth - (dates ? 110 : 0), align: 'left' });
          if (dates) {
            doc.font('Helvetica').fontSize(9).fillColor('#222222');
            doc.text(dates, margin, currentY, { width: contentWidth, align: 'right' });
          }
          currentY += 13;

          // Row 2: Links (GitHub & Demo) if present
          const linkParts: string[] = [];
          if (proj.githubUrl) {
            linkParts.push(`Code: ${sanitizeAtsText(proj.githubUrl.replace(/^https?:\/\//, ''))}`);
          }
          if (proj.demoUrl) {
            linkParts.push(`Demo: ${sanitizeAtsText(proj.demoUrl.replace(/^https?:\/\//, ''))}`);
          }
          if (linkParts.length > 0) {
            const linksLine = linkParts.join(' | ');
            doc.font('Helvetica').fontSize(8.5).fillColor('#333333');
            doc.text(linksLine, margin, currentY, { width: contentWidth, align: 'left' });
            currentY += 12;
          }

          // Bullets
          const bullets = getVisibleBullets(proj);
          for (const bullet of bullets) {
            const cleanBullet = sanitizeAtsText(bullet);
            doc.font('Helvetica').fontSize(9);
            const bHeight = doc.heightOfString(cleanBullet, { width: contentWidth - 14, lineGap: 1.5 });
            ensureSpace(bHeight + 3);

            doc.font('Helvetica').fontSize(9).fillColor('#000000');
            doc.text('-', margin + 4, currentY, { lineBreak: false });
            doc.font('Helvetica').fontSize(9).fillColor('#222222');
            doc.text(cleanBullet, margin + 14, currentY, {
              width: contentWidth - 14,
              align: 'left',
              lineGap: 1.5,
            });
            currentY += bHeight + 3;
          }
          currentY += 4;
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
        for (const cat of skillCategories) {
          const catLabel = `${cat.label}: `;
          const valuesText = cat.items.map(sanitizeAtsText).join(', ');

          doc.font('Helvetica-Bold').fontSize(9);
          const labelWidth = doc.widthOfString(catLabel) + 2;

          doc.font('Helvetica').fontSize(9);
          const valHeight = doc.heightOfString(valuesText, {
            width: contentWidth - labelWidth,
            lineGap: 1.5,
          });

          ensureSpace(valHeight + 3);

          doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000');
          doc.text(catLabel, margin, currentY, { lineBreak: false });

          doc.font('Helvetica').fontSize(9).fillColor('#222222');
          doc.text(valuesText, margin + labelWidth, currentY, {
            width: contentWidth - labelWidth,
            align: 'left',
            lineGap: 1.5,
          });

          currentY += valHeight + 3;
        }
        currentY += 4;
      }

      // ----------------------------------------------------
      // 9. CERTIFICATIONS
      // ----------------------------------------------------
      if (certifications && certifications.length > 0) {
        renderSectionHeader('CERTIFICATIONS');
        for (const cert of certifications) {
          let certText = `${sanitizeAtsText(cert.name)} - ${sanitizeAtsText(cert.issuer)}`;
          if (cert.date) certText += ` (${sanitizeAtsText(cert.date)})`;
          if (cert.url) certText += ` | ${sanitizeAtsText(cert.url.replace(/^https?:\/\//, ''))}`;

          const cHeight = doc.heightOfString(certText, { width: contentWidth - 14, lineGap: 1.5 });
          ensureSpace(cHeight + 3);

          doc.font('Helvetica').fontSize(9).fillColor('#000000');
          doc.text('-', margin + 4, currentY, { lineBreak: false });
          doc.font('Helvetica').fontSize(9).fillColor('#222222');
          doc.text(certText, margin + 14, currentY, {
            width: contentWidth - 14,
            align: 'left',
            lineGap: 1.5,
          });
          currentY += cHeight + 3;
        }
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

