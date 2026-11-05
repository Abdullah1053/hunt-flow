import React from 'react';
import path from 'path';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
  Font,
} from '@react-pdf/renderer';
import { MasterCvProfile, isItemVisible, getVisibleBullets } from '@/types/masterCv';

// Register embedded TrueType font (Roboto) with exact file paths
const fontsDir = path.resolve(process.cwd(), 'public', 'fonts');

Font.register({
  family: 'Roboto',
  fonts: [
    { src: path.join(fontsDir, 'Roboto-Regular.ttf'), fontWeight: 'normal', fontStyle: 'normal' },
    { src: path.join(fontsDir, 'Roboto-Bold.ttf'), fontWeight: 'bold', fontStyle: 'normal' },
    { src: path.join(fontsDir, 'Roboto-Italic.ttf'), fontWeight: 'normal', fontStyle: 'italic' },
    { src: path.join(fontsDir, 'Roboto-BoldItalic.ttf'), fontWeight: 'bold', fontStyle: 'italic' },
  ],
});

// Disable word hyphenation to prevent splitting words across lines
Font.registerHyphenationCallback((word) => [word]);

// Styles for ATS/LinkedIn-compliant vector PDF
const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 40,
    fontFamily: 'Roboto',
    fontSize: 9.5,
    lineHeight: 1.3,
    color: '#000000',
  },
  // Header
  header: {
    textAlign: 'center',
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  headline: {
    fontSize: 9,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  contactRow: {
    fontSize: 8.5,
    fontFamily: 'Roboto',
    fontWeight: 'normal',
    color: '#333333',
    textAlign: 'center',
    lineHeight: 1.3,
  },
  link: {
    color: '#000000',
    textDecoration: 'none',
  },
  // Section Titles
  sectionTitle: {
    fontSize: 10.5,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    borderBottomWidth: 0.75,
    borderBottomColor: '#000000',
    paddingBottom: 2,
    marginTop: 8,
    marginBottom: 5,
  },
  // Entry block
  entryBlock: {
    marginBottom: 6,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  titleBold: {
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    fontSize: 9.5,
  },
  subtitleItalic: {
    fontFamily: 'Roboto',
    fontStyle: 'italic',
    fontSize: 9,
    color: '#222222',
  },
  dateText: {
    fontSize: 8.5,
    fontFamily: 'Roboto',
    fontWeight: 'normal',
    color: '#222222',
  },
  locationText: {
    fontSize: 8.5,
    fontFamily: 'Roboto',
    fontWeight: 'normal',
    color: '#333333',
  },
  summaryText: {
    fontSize: 9,
    fontFamily: 'Roboto',
    fontWeight: 'normal',
    lineHeight: 1.35,
    textAlign: 'left',
    marginBottom: 4,
  },
  // Bullets
  bulletList: {
    marginTop: 2,
    paddingLeft: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 2,
    alignItems: 'flex-start',
  },
  bulletDot: {
    width: 10,
    fontSize: 9,
    fontFamily: 'Roboto',
    textAlign: 'left',
  },
  bulletContent: {
    flex: 1,
    fontSize: 9,
    fontFamily: 'Roboto',
    fontWeight: 'normal',
    lineHeight: 1.3,
    textAlign: 'left',
  },
  // Skills
  skillCategoryRow: {
    flexDirection: 'row',
    marginBottom: 2.5,
    fontSize: 9,
    fontFamily: 'Roboto',
    lineHeight: 1.3,
  },
  skillLabel: {
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    width: 135,
  },
  skillValues: {
    flex: 1,
    fontFamily: 'Roboto',
    fontWeight: 'normal',
    color: '#222222',
    textAlign: 'left',
  },
});

interface AtsPdfDocumentProps {
  profile: MasterCvProfile;
}

export const AtsPdfDocument: React.FC<AtsPdfDocumentProps> = ({ profile }) => {
  const {
    personalInfo = {} as any,
    skills = {} as any,
    experience = [],
    projects = [],
    education = [],
    certifications = [],
  } = profile || {};

  const languages = skills?.languages || [];
  const frameworks = skills?.frameworks || [];
  const databases = skills?.databases || [];
  const devopsAndCloud = skills?.devopsAndCloud || [];
  const toolsAndConcepts = skills?.toolsAndConcepts || [];

  // Build contact items array
  const contactParts: { text: string; href?: string }[] = [];
  if (personalInfo.location) contactParts.push({ text: personalInfo.location });
  if (personalInfo.phone) contactParts.push({ text: personalInfo.phone, href: `tel:${personalInfo.phone}` });
  if (personalInfo.email) contactParts.push({ text: personalInfo.email, href: `mailto:${personalInfo.email}` });
  if (personalInfo.github) {
    contactParts.push({
      text: personalInfo.github.replace(/^https?:\/\//, ''),
      href: personalInfo.github,
    });
  }
  if (personalInfo.linkedin) {
    contactParts.push({
      text: personalInfo.linkedin.replace(/^https?:\/\//, ''),
      href: personalInfo.linkedin,
    });
  }
  if (personalInfo.website) {
    contactParts.push({
      text: personalInfo.website.replace(/^https?:\/\//, ''),
      href: personalInfo.website,
    });
  }

  const candidateName = (personalInfo.fullName || 'Candidate Name').toUpperCase();
  const headline = personalInfo.headline ? personalInfo.headline.toUpperCase() : null;

  return (
    <Document
      title={`${personalInfo.fullName || 'Candidate'} - ATS Resume`}
      author={personalInfo.fullName || 'Candidate'}
      subject="ATS-Optimized Software Engineer Resume"
      keywords="Software Engineer, Resume, Full-Stack, Developer, ATS"
    >
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={{ marginBottom: 3 }}>
            <Text style={styles.name}>{candidateName}</Text>
          </View>

          {headline && (
            <View style={{ marginBottom: 4 }}>
              <Text style={styles.headline}>{headline}</Text>
            </View>
          )}

          {contactParts.length > 0 && (
            <Text style={styles.contactRow}>
              {contactParts.map((item, idx) => (
                <React.Fragment key={idx}>
                  {item.href ? (
                    <Link src={item.href} style={styles.link}>
                      {item.text}
                    </Link>
                  ) : (
                    item.text
                  )}
                  {idx < contactParts.length - 1 ? ' | ' : ''}
                </React.Fragment>
              ))}
            </Text>
          )}
        </View>

        {/* SUMMARY */}
        {personalInfo.summary && (
          <View wrap={false}>
            <Text style={styles.sectionTitle}>PROFESSIONAL SUMMARY</Text>
            <Text style={styles.summaryText}>{personalInfo.summary}</Text>
          </View>
        )}

        {/* EDUCATION */}
        {education.length > 0 && (
          <View wrap={false}>
            <Text style={styles.sectionTitle}>EDUCATION</Text>
            {education.map((edu) => (
              <View key={edu.id} style={styles.entryBlock} wrap={false}>
                <View style={styles.rowBetween}>
                  <Text style={styles.titleBold}>{edu.institution}</Text>
                  <Text style={styles.dateText}>
                    {edu.startDate} - {edu.endDate}
                  </Text>
                </View>
                <View style={styles.rowBetween}>
                  <Text style={styles.subtitleItalic}>
                    {edu.degree}
                    {edu.field ? ` in ${edu.field}` : ''}
                    {edu.gpa ? ` - GPA: ${edu.gpa}` : ''}
                  </Text>
                </View>
                {edu.achievements && edu.achievements.length > 0 && (
                  <View style={styles.bulletList}>
                    {edu.achievements.map((ach, aIdx) => (
                      <View key={aIdx} style={styles.bulletRow}>
                        <Text style={styles.bulletDot}>•</Text>
                        <Text style={styles.bulletContent}>{ach}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* WORK EXPERIENCE */}
        {experience.filter(isItemVisible).length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>EXPERIENCE</Text>
            {experience.filter(isItemVisible).map((exp) => {
              const visibleBullets = getVisibleBullets(exp);
              return (
                <View key={exp.id} style={styles.entryBlock} wrap={false}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.titleBold}>{exp.role}</Text>
                    <Text style={styles.dateText}>
                      {exp.startDate} - {exp.endDate}
                    </Text>
                  </View>
                  <View style={styles.rowBetween}>
                    <Text style={styles.subtitleItalic}>{exp.company}</Text>
                    <Text style={styles.locationText}>{exp.location}</Text>
                  </View>
                  {visibleBullets.length > 0 && (
                    <View style={styles.bulletList}>
                      {visibleBullets.map((bullet, bIdx) => (
                        <View key={bIdx} style={styles.bulletRow}>
                          <Text style={styles.bulletDot}>•</Text>
                          <Text style={styles.bulletContent}>{bullet}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* PROJECTS */}
        {projects.filter(isItemVisible).length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>PROJECTS</Text>
            {projects.filter(isItemVisible).map((proj) => {
              const visibleBullets = getVisibleBullets(proj);
              return (
                <View key={proj.id} style={styles.entryBlock} wrap={false}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.titleBold}>
                      {proj.title}
                      {proj.techStack && proj.techStack.length > 0
                        ? ` | ${proj.techStack.join(', ')}`
                        : ''}
                    </Text>
                    {proj.startDate && (
                      <Text style={styles.dateText}>
                        {proj.startDate} - {proj.endDate || 'Present'}
                      </Text>
                    )}
                  </View>
                  {proj.impactMetric && (
                    <Text style={[styles.subtitleItalic, { fontSize: 8.5, marginBottom: 1 }]}>
                      Impact: {proj.impactMetric}
                    </Text>
                  )}
                  {visibleBullets.length > 0 && (
                    <View style={styles.bulletList}>
                      {visibleBullets.map((bullet, bIdx) => (
                        <View key={bIdx} style={styles.bulletRow}>
                          <Text style={styles.bulletDot}>•</Text>
                          <Text style={styles.bulletContent}>{bullet}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* TECHNICAL SKILLS */}
        <View wrap={false}>
          <Text style={styles.sectionTitle}>TECHNICAL SKILLS</Text>
          {languages.length > 0 && (
            <View style={styles.skillCategoryRow}>
              <Text style={styles.skillLabel}>Languages:</Text>
              <Text style={styles.skillValues}>{languages.join(', ')}</Text>
            </View>
          )}
          {frameworks.length > 0 && (
            <View style={styles.skillCategoryRow}>
              <Text style={styles.skillLabel}>Frameworks & Libraries:</Text>
              <Text style={styles.skillValues}>{frameworks.join(', ')}</Text>
            </View>
          )}
          {databases.length > 0 && (
            <View style={styles.skillCategoryRow}>
              <Text style={styles.skillLabel}>Databases:</Text>
              <Text style={styles.skillValues}>{databases.join(', ')}</Text>
            </View>
          )}
          {devopsAndCloud.length > 0 && (
            <View style={styles.skillCategoryRow}>
              <Text style={styles.skillLabel}>DevOps & Cloud:</Text>
              <Text style={styles.skillValues}>{devopsAndCloud.join(', ')}</Text>
            </View>
          )}
          {toolsAndConcepts.length > 0 && (
            <View style={styles.skillCategoryRow}>
              <Text style={styles.skillLabel}>Architecture & Concepts:</Text>
              <Text style={styles.skillValues}>{toolsAndConcepts.join(', ')}</Text>
            </View>
          )}
        </View>

        {/* CERTIFICATIONS */}
        {certifications.length > 0 && (
          <View wrap={false}>
            <Text style={styles.sectionTitle}>CERTIFICATIONS</Text>
            <View style={styles.bulletList}>
              {certifications.map((cert) => (
                <View key={cert.id} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletContent}>
                    {cert.name} - {cert.issuer} ({cert.date})
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
};
