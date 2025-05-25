import React, { useState } from 'react';
import {
  Plus,
  Target,
  DollarSign,
  FileText,
  TrendingUp,
  Phone,
  Mail,
  Users,
} from 'lucide-react';
import { sampleRecentActivities, sampleDeals } from '@/data/sampleData';
import AddContactModal from '../contacts/AddContactModal';

const DashboardPage: React.FC = () => {
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);

  // Data for stats cards - can be fetched from a backend later
  const statsCards = [
    {
      title: 'Aktive Deals',
      value: '12',
      change: '+2 diese Woche',
      changeColor: 'text-green-600',
      icon: Target,
      iconBg: 'bg-blue-100',
      iconColor: 'text-primary-blue',
    },
    {
      title: 'Pipeline Value',
      value: '€158k',
      change: '+€25k diese Woche',
      changeColor: 'text-green-600',
      icon: DollarSign,
      iconBg: 'bg-green-100',
      iconColor: 'text-success-green',
    },
    {
      title: 'Assessments',
      value: '47',
      change: '8 diese Woche',
      changeColor: 'text-primary-blue',
      icon: FileText,
      iconBg: 'bg-purple-100', // Assuming purple is a desired color, not in brand manual primary
      iconColor: 'text-purple-600', // Assuming purple is a desired color
    },
    {
      title: 'Conversion Rate',
      value: '24%',
      change: '+3% vs. letzter Monat',
      changeColor: 'text-green-600',
      icon: TrendingUp,
      iconBg: 'bg-orange-100', // Assuming orange is a desired color
      iconColor: 'text-warning-orange',
    },
  ];

  const getIconForActivity = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="w-5 h-5 text-success-green" />;
      case 'email': return <Mail className="w-5 h-5 text-primary-blue" />;
      case 'meeting': return <Users className="w-5 h-5 text-purple-600" />;
      case 'assessment': return <FileText className="w-5 h-5 text-warning-orange" />;
      default: return null;
    }
  };

  const getActivityIconBg = (type: string) => {
    switch (type) {
      case 'call': return 'bg-green-100';
      case 'email': return 'bg-blue-100';
      case 'meeting': return 'bg-purple-100';
      case 'assessment': return 'bg-orange-100';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header - This is now part of MainLayout, but keeping title structure for context */}
      <div className="flex justify-between items-center">
        <div>
          {/* Page title is now in MainLayout's Header component */}
          {/* <h1 className="text-3xl font-bold text-gray-900">Guten Tag, Jonas! 👋</h1> */}
          {/* <p className="text-gray-600">Hier ist dein Business-Überblick für heute</p> */}
        </div>
        <button 
          onClick={() => setIsAddContactModalOpen(true)}
          className="bg-primary-blue text-white px-4 py-2 rounded-md hover:bg-primary-blue-dark transition-colors flex items-center space-x-2 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>Neuer Kontakt</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <div key={index} className="bg-white p-5 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200 ease-in-out">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                  <p className={`text-xs ${card.changeColor} mt-1`}>{card.change}</p>
                </div>
                <div className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                  <IconComponent className={`w-6 h-6 ${card.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-5 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Letzte Aktivitäten</h3>
          </div>
          <div className="p-5">
            <div className="space-y-4">
              {sampleRecentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getActivityIconBg(activity.type)}`}>
                    {getIconForActivity(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-800">{activity.contact}</p>
                    <p className="text-xs text-gray-600">{activity.description}</p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pipeline Overview */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-5 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Sales Pipeline</h3>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              {sampleDeals.slice(0, 4).map((deal) => (
                <div key={deal.id} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                  <div>
                    <p className="font-medium text-sm text-gray-800">{deal.title}</p>
                    <p className="text-xs text-gray-600">{deal.company}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm text-gray-800">€{deal.value.toLocaleString()}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${ 
                      deal.stage === 'Abgeschlossen' ? 'bg-success-green-light/20 text-success-green' :
                      deal.stage === 'Verhandlung' ? 'bg-blue-100 text-primary-blue' : // Assuming purple is desired from screenshot
                      deal.stage === 'Angebot' ? 'bg-purple-100 text-purple-600' : // Using purple based on user's design
                      'bg-gray-200 text-gray-700'
                    }`}>
                      {deal.stage}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AddContactModal einfügen */}
      <AddContactModal 
        isOpen={isAddContactModalOpen} 
        onClose={() => setIsAddContactModalOpen(false)} 
      />
    </div>
  );
};

export default DashboardPage; 