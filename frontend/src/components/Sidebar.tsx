import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import {
  DashboardOutlined,
  VideoCameraOutlined,
  FireOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  BarChartOutlined,
  SettingOutlined
} from '@ant-design/icons'

const { Sider } = Layout

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '工作台' },
  { key: '/videos', icon: <VideoCameraOutlined />, label: '创作中心' },
  { key: '/trends', icon: <FireOutlined />, label: '热点追踪' },
  { key: '/calendar', icon: <CalendarOutlined />, label: '内容日历' },
  { key: '/tasks', icon: <CheckSquareOutlined />, label: '任务管理' },
  { key: '/stats', icon: <BarChartOutlined />, label: '数据中心' },
  { key: '/settings', icon: <SettingOutlined />, label: '系统设置' }
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Sider 
      collapsible 
      collapsed={collapsed} 
      onCollapse={(value) => setCollapsed(value)}
      theme="light"
      style={{ boxShadow: '2px 0 8px rgba(0,0,0,0.06)' }}
    >
      <div style={{ 
        height: '64px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        borderBottom: '1px solid #f0f0f0',
        fontSize: collapsed ? '14px' : '18px',
        fontWeight: 'bold',
        color: '#1677ff'
      }}>
        {collapsed ? '武当' : '武当创作系统'}
      </div>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{ borderRight: 0 }}
      />
    </Sider>
  )
}
