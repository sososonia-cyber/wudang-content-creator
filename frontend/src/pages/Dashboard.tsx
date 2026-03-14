import { Row, Col, Card, Statistic, List, Tag, Button, Space, Typography } from 'antd'
import { 
  VideoCameraOutlined, 
  FireOutlined, 
  CheckCircleOutlined, 
  EyeOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography

const stats = [
  { title: '今日播放量', value: 128456, icon: <EyeOutlined />, change: 23.5, color: '#1677ff' },
  { title: '今日互动', value: 8234, icon: <FireOutlined />, change: 15.2, color: '#52c41a' },
  { title: '新增粉丝', value: 156, icon: <CheckCircleOutlined />, change: -5.3, color: '#faad14' },
  { title: '待办任务', value: 5, icon: <VideoCameraOutlined />, change: 0, color: '#f5222d' }
]

const todoList = [
  { title: '《武当云海》视频审核', tag: '审核中', color: 'warning', deadline: '今天' },
  { title: '《太极入门》内容修改', tag: '修改中', color: 'processing', deadline: '今天' },
  { title: '明日 9:00 抖音发布排期', tag: '待发布', color: 'success', deadline: '明天' },
  { title: '热点 #武当山雪景 响应', tag: '热点', color: 'error', deadline: '24小时内' }
]

const trendList = [
  { title: '#武当山雪景', heat: '98.5w', risk: '低', sentiment: '正面', recommend: '立即创作' },
  { title: '#春季养生', heat: '65.2w', risk: '中', sentiment: '正面', recommend: '太极结合' },
  { title: '#古装变装', heat: '120w', risk: '高', sentiment: '中性', recommend: '谨慎使用' }
]

export default function Dashboard() {
  return (
    <div>
      <Title level={4}>工作台</Title>
      <Text type="secondary">欢迎回来，今日有 {todoList.length} 个待办任务需要处理</Text>
      
      <Row gutter={16} style={{ marginTop: 24, marginBottom: 24 }}>
        {stats.map((stat, index) => (
          <Col span={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                valueStyle={{ color: stat.color }}
                prefix={stat.icon}
                suffix={stat.change !== 0 && (
                  <Text type={stat.change > 0 ? 'success' : 'danger'} style={{ fontSize: '14px' }}>
                    {stat.change > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                    {Math.abs(stat.change)}%
                  </Text>
                )}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card 
            title="待办任务" 
            extra={<Button type="link">查看全部</Button>}
          >
            <List
              dataSource={todoList}
              renderItem={item => (
                <List.Item
                  actions={[<Button type="primary" size="small">处理</Button>]}
                >
                  <List.Item.Meta
                    title={item.title}
                    description={<Text type="secondary">截止: {item.deadline}</Text>}
                  />
                  <Tag color={item.color}>{item.tag}</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        
        <Col span={12}>
          <Card 
            title="今日热点推荐 (MiroFish)" 
            extra={<Button type="link">查看更多</Button>}
          >
            <List
              dataSource={trendList}
              renderItem={item => (
                <List.Item
                  actions={[<Button type="link" size="small">创作</Button>]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <FireOutlined style={{ color: '#ff4d4f' }} />
                        <Text strong>{item.title}</Text>
                      </Space>
                    }
                    description={
                      <Space size={16}>
                        <Text type="secondary">热度: {item.heat}</Text>
                        <Tag color={item.risk === '高' ? 'error' : item.risk === '中' ? 'warning' : 'success'}>
                          风险{item.risk}
                        </Tag>
                        <Tag color={item.sentiment === '正面' ? 'success' : 'default'}>{item.sentiment}</Tag>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="快捷入口">
            <Space size={16}>
              <Button type="primary" icon={<VideoCameraOutlined />} size="large">
                创建视频
              </Button>
              <Button icon={<FireOutlined />} size="large">
                热点追踪
              </Button>
              <Button icon={<EyeOutlined />} size="large">
                数据看板
              </Button>
              <Button icon={<CheckCircleOutlined />} size="large">
                任务管理
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
