import { Card, Row, Col, Statistic, DatePicker, Select, Space, Typography, Table, List } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined, PlayCircleOutlined, LikeOutlined, MessageOutlined, ShareAltOutlined } from '@ant-design/icons'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

const topVideos = [
  { title: '武当云海', views: '45.2w', growth: '+12%' },
  { title: '太极教学', views: '32.1w', growth: '+8%' },
  { title: '金顶日出', views: '28.5w', growth: '+15%' },
  { title: '道教文化', views: '22.3w', growth: '+5%' },
  { title: '功夫展示', views: '18.7w', growth: '-2%' },
]

const platformStats = [
  { platform: '抖音', views: '125w', percentage: 45 },
  { platform: '视频号', views: '69w', percentage: 25 },
  { platform: '小红书', views: '55w', percentage: 20 },
  { platform: '快手', views: '19w', percentage: 7 },
  { platform: 'B站', views: '8w', percentage: 3 },
]

export default function Stats() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>数据中心</Title>
        <Space>
          <RangePicker />
          <Select defaultValue="all" style={{ width: 120 }}>
            <Select.Option value="all">全部平台</Select.Option>
            <Select.Option value="douyin">抖音</Select.Option>
            <Select.Option value="xiaohongshu">小红书</Select.Option>
          </Select>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总播放量"
              value={2760000}
              precision={0}
              valueStyle={{ color: '#1677ff' }}
              prefix={<PlayCircleOutlined />}
              suffix={<Text type="success" style={{ fontSize: 14 }}><ArrowUpOutlined /> 23%</Text>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总点赞"
              value={156000}
              valueStyle={{ color: '#52c41a' }}
              prefix={<LikeOutlined />}
              suffix={<Text type="success" style={{ fontSize: 14 }}><ArrowUpOutlined /> 15%</Text>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总评论"
              value={45000}
              valueStyle={{ color: '#faad14' }}
              prefix={<MessageOutlined />}
              suffix={<Text type="success" style={{ fontSize: 14 }}><ArrowUpOutlined /> 8%</Text>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总分享"
              value={23000}
              valueStyle={{ color: '#722ed1' }}
              prefix={<ShareAltOutlined />}
              suffix={<Text type="danger" style={{ fontSize: 14 }}><ArrowDownOutlined /> 3%</Text>}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="平台分布">
            {platformStats.map((item, index) => (
              <div key={index} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text>{item.platform}</Text>
                  <Text>{item.views} ({item.percentage}%)</Text>
                </div>
                <div style={{ background: '#f0f0f0', borderRadius: 4, height: 8 }}>
                  <div style={{ 
                    background: index === 0 ? '#1677ff' : index === 1 ? '#52c41a' : index === 2 ? '#faad14' : '#d9d9d9',
                    width: `${item.percentage}%`,
                    height: '100%',
                    borderRadius: 4
                  }} />
                </div>
              </div>
            ))}
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="热门视频 TOP 5">
            <List
              dataSource={topVideos}
              renderItem={(item, index) => (
                <List.Item>
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Text strong style={{ width: 30 }}>{index + 1}</Text>
                    <Text style={{ flex: 1 }}>{item.title}</Text>
                    <Text type="secondary" style={{ marginRight: 16 }}>{item.views}</Text>
                    <Text type={item.growth.startsWith('+') ? 'success' : 'danger'}>{item.growth}</Text>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
