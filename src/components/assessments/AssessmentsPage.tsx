import React from 'react';
import {
  BarChart3,
  Users,
  Zap,
  Eye
} from 'lucide-react';

// Placeholder data for assessments - replace with actual data source later
const assessmentToolsData = [
  {
    id: 'digital-assessment',
    name: 'Digital Assessment',
    runs: 47,
    description: 'Umfassende Bewertung des Digitalisierungsgrads von Unternehmen',
    icon: BarChart3,
    iconBg: 'bg-blue-100',
    iconColor: 'text-primary-blue',
    buttonBg: 'bg-blue-50',
    buttonTextColor: 'text-primary-blue',
    buttonHoverBg: 'hover:bg-blue-100',
  },
  {
    id: 'ki-readiness',
    name: 'KI-Readiness',
    runs: 23,
    description: 'Bewertung der KI-Bereitschaft und EU AI Act Compliance',
    icon: Zap,
    iconBg: 'bg-purple-100', // Using purple as in user's design
    iconColor: 'text-purple-600',
    buttonBg: 'bg-purple-50',
    buttonTextColor: 'text-purple-600',
    buttonHoverBg: 'hover:bg-purple-100',
  },
  {
    id: 'crm-builder',
    name: 'CRM Builder',
    runs: 31,
    description: 'Interaktiver CRM-Feature-Builder mit Kostenberechnung',
    icon: Users, // Using Users icon as in user's design
    iconBg: 'bg-green-100',
    iconColor: 'text-success-green',
    buttonBg: 'bg-green-50',
    buttonTextColor: 'text-success-green',
    buttonHoverBg: 'hover:bg-green-100',
  },
];

const latestResultsData = [
  {
    id: 1,
    company: 'Handwerk Digital AG',
    assessment: 'Digital Assessment',
    score: '45/100',
    scoreBg: 'bg-yellow-100', // Assuming yellow for this score
    scoreColor: 'text-yellow-800',
    date: '22.05.2025',
    status: 'Follow-up geplant',
    statusBg: 'bg-blue-100',
    statusColor: 'text-primary-blue',
  },
  {
    id: 2,
    company: 'TechStart Solutions',
    assessment: 'KI-Readiness',
    score: '78/100',
    scoreBg: 'bg-green-100',
    scoreColor: 'text-success-green',
    date: '24.05.2025',
    status: 'Lead qualifiziert',
    statusBg: 'bg-green-100',
    statusColor: 'text-success-green',
  },
  // Add more sample results if needed
];

const AssessmentsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Page title is now in MainLayout's Header component */}
        {/* <h1 className="text-3xl font-bold text-gray-900">Assessment Tools</h1> */}
        <div></div> {/* Spacer to push button to the right if no title here */}
        <button className="bg-primary-blue text-white px-4 py-2 rounded-lg hover:bg-primary-blue-dark transition-colors flex items-center space-x-2 text-sm font-medium">
          <Eye className="w-4 h-4" />
          <span>Alle Ergebnisse</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assessmentToolsData.map((tool) => {
          const IconComponent = tool.icon;
          return (
            <div key={tool.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200 ease-in-out flex flex-col">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-12 h-12 ${tool.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <IconComponent className={`w-6 h-6 ${tool.iconColor}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{tool.name}</h3>
                  <p className="text-sm text-gray-600">{tool.runs} Durchläufe</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-4 flex-grow">{tool.description}</p>
              <div className="flex space-x-2 mt-auto">
                <button className={`flex-1 ${tool.buttonBg} ${tool.buttonTextColor} py-2 px-3 rounded-md text-sm font-medium ${tool.buttonHoverBg} transition-colors`}>
                  Ergebnisse
                </button>
                <button className="flex-1 border border-gray-300 text-gray-700 py-2 px-3 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors">
                  Teilen
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Neueste Assessment-Ergebnisse</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unternehmen</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Assessment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Datum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {latestResultsData.map((result) => (
                <tr key={result.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{result.company}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">{result.assessment}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${result.scoreBg} ${result.scoreColor}`}>
                      {result.score}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{result.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${result.statusBg} ${result.statusColor}`}>
                      {result.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-primary-blue hover:text-primary-blue-dark hover:underline transition-colors">
                      Anzeigen
                    </button>
                  </td>
                </tr>
              ))}
              {latestResultsData.length === 0 && (
                 <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                     Keine aktuellen Ergebnisse vorhanden.
                   </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AssessmentsPage; 