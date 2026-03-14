import { useState } from 'react'
import { Table, Tag, Card, Typography, Button, Space, Badge, Modal, List } from 'antd'
import { FireOutlined, RiseOutlined, AlertOutlined, PlayCircleOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

interface Trend {
  id: string
  title: string
  heat: string
  heatValue: number
  risk: '高' | '中' | '低'
  sentiment: '正面' | '负面' | '中性'
  platform: string
  recommend: string
}

const mockTrends: Trend[] = [
  { id: '1', title: '#武当山雪景', heat: '98.5w', heatValue: 985000, risk: '低', sentiment: '正面', platform: '抖音/微博', recommend: '立即创作' },
  { id: '2', title: '#春季养生', heat: '65.2w', heatValue: 652000, risk: '中', sentiment: '正面', platform: '小红书/视频号', recommend: '太极结合' },
  { id: '3', title: '#古装变装', heat: '120w', heatValue: 1200000, risk: '高', sentiment: '中性', platform: '抖音/快手', recommend: '谨慎使用' },
  { id: '4', title: '#道教文化', heat: '45.8w', heatValue: 458000, risk: '低', sentiment: '正面', platform: 'B站/小红书', recommend: '文化解读' },
  { id: '5', title: '#功夫挑战', heat: '78.3w', heatValue: 783000, risk: '中', sentiment: '正面', platform: '抖音/TikTok', recommend: '武术展示' },
]

const riskColors = { '高': 'error', '中': 'warning', '低': 'success' }
const sentimentColors = { '正面': 'success', '负面': 'error', '中性': 'default' }

export default function Trends() {
  const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleCreateContent = (trend: Trend) => {
    setSelectedTrend(trend)
    setIsModalOpen(true)
  }

  const columns = [
    {
      title: '热点话题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Trend) => (
        <Space>
          <FireOutlined style={{ color: '#ff4d4f' }} />
          <Text strong>{text}</Text>
          {record.heatValue > 800000 && <Badge count="爆" style={{ backgroundColor: '#ff4d4f' }} />}
        </Space>
      ),
    },
    {
      title: '热度',
      dataIndex: 'heat',
      key: 'heat',
      width: 100,
      sorter: (a: Trend, b: Trend) => a.heatValue - b.heatValue,
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 150,
    },
    {
      title: '风险',
      dataIndex: 'risk',
      key: 'risk',
      width: 80,
      render: (risk: string) => <Tag color={riskColors[risk as keyof typeof riskColors]}>{risk}</Tag>,
    },
    {
      title: '情感',
      dataIndex: 'sentiment',
      key: 'sentiment',
      width: 80,
      render: (sentiment: string) => <Tag color={sentimentColors[sentiment as keyof typeof sentimentColors]}>{sentiment}</Tag>,
    },
    {
      title: '建议',
      dataIndex: 'recommend',
      key: 'recommend',
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: Trend) => (
        <Button type="primary" size="small" icon={<PlayCircleOutlined />} onClick={() => handleCreateContent(record)}>
          创作
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>热点追踪</Title>
        <Space>
          <Button icon={<RiseOutlined />}>刷新数据</Button>
          <Button type="primary" icon={<AlertOutlined />}>设置监控</Button>
        </Space>
      </div>

      <Card style={{ marginBottom: 16, background: '#f6ffed', borderColor: '#b7eb8f' }}>
        <Space>
          <FireOutlined style={{ color: '#52c41a', fontSize: 24 }} />
          <div>
            <Text strong style={{ fontSize: 16 }}>MiroFish 热点影响预测</Text>
            <br />
            <Text type="secondary">基于AI分析的热点风险评估和创作建议</Text>
          </div>
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={mockTrends}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="热点响应创作"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalOpen(false)}>取消</Button>,
          <Button key="create" type="primary">创建内容</Button>,
        ]}
        width={600}
      >
        {selectedTrend && (
          <div>
            <Card style={{ marginBottom: 16 }}>
              <Title level={5}>{selectedTrend.title}</Title>
              <Space size={16}>
                <Text>热度: {selectedTrend.heat}</Text>
                <Tag color={riskColors[selectedTrend.risk]}>风险{selectedTrend.risk}</Tag>
                <Tag color={sentimentColors[selectedTrend.sentiment]}>{selectedTrend.sentiment}</Tag>
              </Space>
            </Card>

            <Title level={5}>AI 创作建议</Title>
            <List
              bordered
              dataSource={[
                '结合武当山自然风光，展示雪景中的金顶',
                '突出道教文化元素，强调清净氛围',
                '建议发布时间: 早上7-9点，晚上7-9点',
                '预期播放量: 50w-100w',
                '推荐平台: 抖音 > 视频号 > 小红书',
              ]}
              renderItem={(item) => <List.Item>{item}</List.Item>}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}
