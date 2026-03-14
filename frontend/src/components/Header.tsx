import { Layout, Badge, Avatar, Dropdown, Space, Typography } from 'antd'
import { BellOutlined, UserOutlined, DownOutlined } from '@ant-design/icons'

const { Header: AntHeader } = Layout
const { Text } = Typography

export default function Header() {
  const userMenuItems = [
    { key: 'profile', label: '个人中心' },
    { key: 'settings', label: '账号设置' },
    { key: 'logout', label: '退出登录' }
  ]

  return (
    <AntHeader style={{ 
      background: '#fff', 
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      zIndex: 1
    }}>
      <Space size={24}>
        <Badge count={5} size="small">
          <BellOutlined style={{ fontSize: '18px', cursor: 'pointer' }} />
        </Badge>
        
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <Avatar icon={<UserOutlined />} />
            <Text>管理员</Text>
            <DownOutlined style={{ fontSize: '12px' }} />
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  )
}
