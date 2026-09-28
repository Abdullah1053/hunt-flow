import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
  Font,
} from '@react-pdf/renderer';
import { MasterCvProfile } from '@/types/masterCv';

// Styles for ATS-compliant vector PDF (Jake's Resume / Harvard standard)
const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 36,
    fontFamily: 'Times-Roman',
    fontSize: 9.5,
    lineHeight: 1.25,
    color: '#000000',
  },
  // Header
  header: {
    textAlign: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontFamily: 'Times-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  headline: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    color: '#333333',
    marginBottom: 3,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    color: '#333333',
    gap: 4,
  },
  separator: {
    marginHorizontal: 3,
    color: '#888888',
  },
  link: {
    color: '#000000',
    textDecoration: 'none',
  },
  // Section Titles
  sectionTitle: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderBottomWidth: 0.75,
    borderBottomColor: '#000000',
    paddingBottom: 1.5,
    marginTop: 7,
    marginBottom: 4,
  },
  // Entry block
  entryBlock: {
    marginBottom: 5,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  titleBold: {
    fontFamily: 'Times-Bold',
    fontSize: 9.5,
  },
  subtitleItalic: {
    fontFamily: 'Times-Italic',
    fontSize: 9,
    color: '#222222',
  },
  dateText: {
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    color: '#222222',
  },
  locationText: {
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    color: '#333333',
  },
  summaryText: {
    fontSize: 9,
    fontFamily: 'Times-Roman',
    lineHeight: 1.3,
    textAlign: 'justify',
    marginBottom: 4,
  },
  // Bullets
  bulletList: {
    marginTop: 2,
    paddingLeft: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 1.5,
    alignItems: 'flex-start',
  },
  bulletDot: {
    width: 10,
    fontSize: 8,
  },
  bulletContent: {
    flex: 1,
    fontSize: 9,
    lineHeight: 1.25,
    textAlign: 'justify',
  },
  // Skills
  skillCategoryRow: {
    flexDirection: 'row',
    marginBottom: 2,
    fontSize: 9,
    fontFamily: 'Helvetica',
    lineHeight: 1.25,
  },
  skillLabel: {
    fontFamily: 'Helvetica-Bold',
    width: 130,
  },
  skillValues: {
    flex: 1,
    color: '#222222',
  },
});

interface AtsPdfDocumentProps {
  profile: MasterCvProfile;
}

export const AtsPdfDocument: React.FC<AtsPdfDocumentProps> = ({ profile }) => {
  const { personalInfo, skills, experience, projects, education, certifications } = profile;

  // Build contact parts
  const contactParts: { text: string; href?: string }[] = [];
  if (personalInfo.location) contactParts.push({ text: personalInfo.location });
  if (personalInfo.phone) contactParts.push({ text: personalInfo.phone });
  if (personalInfo.email) contactParts.push({ text: personalInfo.email, href: `mailto:${personalInfo.email}` });
  if (personalInfo.github) contactParts.push({ text: personalInfo.github.replace(/^https?:\/\//, ''), href: personalInfo.github });
  if (personalInfo.linkedin) contactParts.push({ text: personalInfo.linkedin.replace(/^https?:\/\//, ''), href: personalInfo.linkedin });
  if (personalInfo.website) contactParts.push({ text: personalInfo.website.replace(/^https?:\/\//, ''), href: personalInfo.website });

  return (
    <Document
      title={`${personalInfo.fullName} - ATS Resume`}
      author={personalInfo.fullName}
      subject="ATS-Optimized Software Engineer Resume"
      keywords="Software Engineer, Resume, Full-Stack, Developer, ATS"
    >
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.name}>{personalInfo.fullName || 'Candidate Name'}</Text>

          {personalInfo.headline && (
            <Text style={styles.headline}>{personalInfo.headline}</Text>
          )}

          <View style={styles.contactRow}>
            {contactParts.map((item, idx) => (
              <React.Fragment key={idx}>
                {item.href ? (
                  <Link src={item.href} style={styles.link}>
                    <Text>{item.text}</Text>
                  </Link>
                ) : (
                  <Text>{item.text}</Text>
                )}
                {idx < contactParts.length - 1 && (
                  <Text style={styles.separator}>|</Text>
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* SUMMARY */}
        {personalInfo.summary && (
          <View wrap={false}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.summaryText}>{personalInfo.summary}</Text>
          </View>
        )}

        {/* EDUCATION */}
        {education.length > 0 && (
          <View wrap={false}>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.map((edu) => (
              <View key={edu.id} style={styles.entryBlock} wrap={false}>
                <View style={styles.rowBetween}>
                  <Text style={styles.titleBold}>{edu.institution}</Text>
                  <Text style={styles.dateText}>
                    {edu.startDate} – {edu.endDate}
                  </Text>
                </View>
                <View style={styles.rowBetween}>
                  <Text style={styles.subtitleItalic}>
                    {edu.degree}
                    {edu.field ? `; ${edu.field}` : ''}
                  </Text>
                  {edu.gpa && <Text style={styles.dateText}>{edu.gpa}</Text>}
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
        {experience.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Work Experience</Text>
            {experience.map((exp) => (
              <View key={exp.id} style={styles.entryBlock} wrap={false}>
                <View style={styles.rowBetween}>
                  <Text style={styles.titleBold}>{exp.company}</Text>
                  <Text style={styles.dateText}>
                    {exp.startDate} – {exp.endDate}
                  </Text>
                </View>
                <View style={styles.rowBetween}>
                  <Text style={styles.subtitleItalic}>{exp.role}</Text>
                  <Text style={styles.locationText}>{exp.location}</Text>
                </View>
                <View style={styles.bulletList}>
                  {exp.bullets.map((bullet, bIdx) => (
                    <View key={bIdx} style={styles.bulletRow}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletContent}>{bullet}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* PROJECTS */}
        {projects.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Key Projects</Text>
            {projects.map((proj) => (
              <View key={proj.id} style={styles.entryBlock} wrap={false}>
                <View style={styles.rowBetween}>
                  <Text style={styles.titleBold}>
                    {proj.title}
                    {proj.techStack.length > 0
                      ? ` | ${proj.techStack.join(', ')}`
                      : ''}
                  </Text>
                  {proj.startDate && (
                    <Text style={styles.dateText}>
                      {proj.startDate} – {proj.endDate || 'Present'}
                    </Text>
                  )}
                </View>
                {proj.impactMetric && (
                  <Text style={[styles.subtitleItalic, { fontSize: 8.5, marginBottom: 1 }]}>
                    Impact: {proj.impactMetric}
                  </Text>
                )}
                <View style={styles.bulletList}>
                  {proj.bullets.map((bullet, bIdx) => (
                    <View key={bIdx} style={styles.bulletRow}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletContent}>{bullet}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* TECHNICAL SKILLS */}
        <View wrap={false}>
          <Text style={styles.sectionTitle}>Technical Skills</Text>
          {skills.languages.length > 0 && (
            <View style={styles.skillCategoryRow}>
              <Text style={styles.skillLabel}>Languages:</Text>
              <Text style={styles.skillValues}>{skills.languages.join(', ')}</Text>
            </View>
          )}
          {skills.frameworks.length > 0 && (
            <View style={styles.skillCategoryRow}>
              <Text style={styles.skillLabel}>Frameworks & Libraries:</Text>
              <Text style={styles.skillValues}>{skills.frameworks.join(', ')}</Text>
            </View>
          )}
          {skills.databases.length > 0 && (
            <View style={styles.skillCategoryRow}>
              <Text style={styles.skillLabel}>Databases & Optimization:</Text>
              <Text style={styles.skillValues}>{skills.databases.join(', ')}</Text>
            </View>
          )}
          {skills.devopsAndCloud.length > 0 && (
            <View style={styles.skillCategoryRow}>
              <Text style={styles.skillLabel}>DevOps & Infrastructure:</Text>
              <Text style={styles.skillValues}>
                {skills.devopsAndCloud.join(', ')}
              </Text>
            </View>
          )}
          {skills.toolsAndConcepts.length > 0 && (
            <View style={styles.skillCategoryRow}>
              <Text style={styles.skillLabel}>Architecture & Concepts:</Text>
              <Text style={styles.skillValues}>
                {skills.toolsAndConcepts.join(', ')}
              </Text>
            </View>
          )}
        </View>

        {/* CERTIFICATIONS */}
        {certifications.length > 0 && (
          <View wrap={false}>
            <Text style={styles.sectionTitle}>Certifications & Licenses</Text>
            <View style={styles.bulletList}>
              {certifications.map((cert) => (
                <View key={cert.id} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletContent}>
                    {cert.name} — {cert.issuer} ({cert.date})
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
