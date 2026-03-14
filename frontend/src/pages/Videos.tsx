import { useState } from 'react'
import { Table, Button, Tag, Space, Card, Typography, Input, Select, Modal, Form, message } from 'antd'
import { PlusOutlined, PlayCircleOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography
const { Option } = Select

interface Video {
  id: string
  title: string
  theme: string
  status: string
  versions: number
  createdAt: string
}

const mockVideos: Video[] = [
  { id: '1', title: '武当山云海日出', theme: '风景', status: '已完成', versions: 3, createdAt: '2026-03-13' },
  { id: '2', title: '太极拳入门教学', theme: '太极', status: '生成中', versions: 1, createdAt: '2026-03-13' },
  { id: '3', title: '武当功夫展示', theme: '武术', status: '草稿', versions: 1, createdAt: '2026-03-12' },
  { id: '4', title: '道教文化探秘', theme: '文化', status: '审核中', versions: 2, createdAt: '2026-03-11' },
]

const themeOptions = [
  { value: 'LANDSCAPE', label: '风景' },
  { value: 'TAICHI', label: '太极' },
  { value: 'MARTIAL_ARTS', label: '武术' },
  { value: 'CULTURE', label: '文化' },
]

const statusColors: Record<string, string> = {
  '草稿': 'default',
  '生成中': 'processing',
  '已完成': 'success',
  '审核中': 'warning',
  '已发布': 'success',
}

export default function Videos() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const columns: ColumnsType<Video> = [
    {
      title: '视频标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '主题',
      dataIndex: 'theme',
      key: 'theme',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => <Tag color={statusColors[status]}>{status}</Tag>,
    },
    {
      title: '版本数',
      dataIndex: 'versions',
      key: 'versions',
      width: 80,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button type="text" icon={<EyeOutlined />} size="small">查看</Button>
          {record.status === '草稿' && (
            <Button type="text" icon={<PlayCircleOutlined />} size="small" onClick={() => handleGenerate(record)}>生成</Button>
          )}
          <Button type="text" icon={<EditOutlined />} size="small">编辑</Button>
          <Button type="text" danger icon={<DeleteOutlined />} size="small">删除</Button>
        </Space>
      ),
    },
  ]

  const handleCreate = async (values: any) => {
    setLoading(true)
    try {
      // TODO: 调用API创建视频
      console.log('创建视频:', values)
      message.success('视频创建成功')
      setIsModalOpen(false)
      form.resetFields()
    } catch (error) {
      message.error('创建失败')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = (video: Video) => {
    Modal.confirm({
      title: '生成视频',
      content: `确认生成视频 "${video.title}"?`,
      onOk: () => {
        message.success('已提交生成任务')
      },
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>创作中心</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          创建视频
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          <Input placeholder="搜索视频..." style={{ width: 200 }} />
          <Select placeholder="全部状态" style={{ width: 120 }} allowClear>
            <Option value="draft">草稿</Option>
            <Option value="generating">生成中</Option>
            <Option value="completed">已完成</Option>
          </Select>
          <Select placeholder="全部主题" style={{ width: 120 }} allowClear>
            {themeOptions.map(opt => <Option key={opt.value} value={opt.value}>{opt.label}</Option>)}
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={mockVideos}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="创建视频"
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Form.Item
            name="title"
            label="视频标题"
            rules={[{ required: true, message: '请输入视频标题' }]}
          >
            <Input placeholder="例如: 武当山云海日出" />
          </Form.Item>

          <Form.Item
            name="theme"
            label="主题类型"
            rules={[{ required: true, message: '请选择主题类型' }]}
          >
            <Select placeholder="选择主题">
              {themeOptions.map(opt => <Option key={opt.value} value={opt.value}>{opt.label}</Option>)}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea rows={3} placeholder="视频描述（可选）" />
          </Form.Item>

          <Form.Item
            name="versions"
            label="生成版本数"
            initialValue={1}
          >
            <Select>
              <Option value={1}>1个版本</Option>
              <Option value={3}>3个版本（差异化）</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
