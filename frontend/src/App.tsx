import { Routes, Route } from 'react-router-dom'
import { Layout } from 'antd'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Videos from './pages/Videos'
import Trends from './pages/Trends'
import Calendar from './pages/Calendar'
import Tasks from './pages/Tasks'
import Stats from './pages/Stats'
import Settings from './pages/Settings'
import './App.css'

const { Content } = Layout

function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout>
        <Header />
        <Content style={{ margin: '24px', padding: '24px', background: '#fff', borderRadius: '8px' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/trends" element={<Trends />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
