import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import AuthProvider from '@/services/firebase/AuthProvider'

ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  // </React.StrictMode>,
) 