import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { AssessmentResult, ASSESSMENT_TOOL_DETAILS } from '@/types/assessmentTypes';
import { Timestamp } from 'firebase/firestore';

// Register Fonts (optional, but good for consistent look)
// Make sure to have these font files in your public folder or accessible via URL
// Font.register({
//   family: 'Open Sans',
//   fonts: [
//     { src: '/fonts/OpenSans-Regular.ttf' }, // Example path
//     { src: '/fonts/OpenSans-Bold.ttf', fontWeight: 'bold' },
//   ]
// });

// Define styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica', // Fallback font, replace with registered font if desired
    fontSize: 11,
    paddingTop: 30,
    paddingLeft: 40,
    paddingRight: 40,
    paddingBottom: 30,
    lineHeight: 1.5,
    color: '#333',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1a237e', // Dark blue
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#283593', // Medium blue
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 3,
  },
  subHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 3,
  },
  text: {
    fontSize: 10,
    marginBottom: 5,
  },
  listItem: {
    fontSize: 10,
    marginLeft: 15, // Indent list items
    marginBottom: 3,
  },
  badge: {
    backgroundColor: '#e3f2fd', // Light blue background
    color: '#0d47a1', // Dark blue text
    padding: '3px 6px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#aaa',
  },
});

const formatDateForPDF = (timestamp: Timestamp | Date | undefined): string => {
  if (!timestamp) return 'N/A';
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
         date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
};

interface AssessmentPDFDocumentProps {
  result: AssessmentResult;
}

export const AssessmentPDFDocument: React.FC<AssessmentPDFDocumentProps> = ({ result }) => {
  const toolDetails = ASSESSMENT_TOOL_DETAILS[result.type];

  return (
    <Document title={`${toolDetails?.name || result.type} - Ergebnisbericht`} author="BE_AUTOMATED CRM">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text>{toolDetails?.name || result.type} - Ergebnisbericht</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subHeader}>Allgemeine Informationen</Text>
          <Text style={styles.text}>Teilnehmer: {result.assessedEmail || 'N/A'}</Text>
          <Text style={styles.text}>Abgeschlossen am: {formatDateForPDF(result.completedAt)}</Text>
          <Text style={styles.text}>Score: <Text style={styles.badge}>{result.score}%</Text></Text>
          {result.contactId && (
            <Text style={styles.text}>Verknüpfter Kontakt ID: {result.contactId}</Text>
          )}
        </View>

        {result.recommendations && result.recommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Empfehlungen</Text>
            {result.recommendations.map((rec, index) => (
              <Text key={rec.id || index} style={styles.listItem}>• {rec.text}</Text>
            ))}
          </View>
        )}

        {/* Optional: Add more sections for score details, notes etc. */}
        {/* Example for notes if they were part of AssessmentResult */}
        {/* {result.additionalNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Zusätzliche Notizen</Text>
            <Text style={styles.text}>{result.additionalNotes}</Text>
          </View>
        )} */}

        <View style={styles.footer}>
          <Text render={({ pageNumber, totalPages }) => (
            `Seite ${pageNumber} / ${totalPages} | Generiert am ${new Date().toLocaleDateString('de-DE')} durch BE_AUTOMATED CRM`
          )} fixed />
        </View>
      </Page>
    </Document>
  );
}; 