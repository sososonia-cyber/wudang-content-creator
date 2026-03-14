import { useState } from 'react'
import { Table, Card, Typography, Button, Tag, Badge, Space, Select, Dropdown } from 'antd'
import { PlusOutlined, MoreOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography
const { Option } = Select

interface Task {
  id: string
  title: string
  type: string
  assignee: string
  status: string
  priority: string
  dueDate: string
  videoTitle?: string
}

const mockTasks: Task[] = [
  { id: '1', title: '《武当云海》视频审核', type: '审核', assignee: '张三', status: '审核中', priority: '高', dueDate: '今天', videoTitle: '武当山云海日出' },
  { id: '2', title: '《太极入门》内容修改', type: '修改', assignee: '李四', status: '修改中', priority: '中', dueDate: '今天', videoTitle: '太极拳入门教学' },
  { id: '3', title: '明日抖音发布确认', type: '发布', assignee: '王五', status: '待确认', priority: '高', dueDate: '明天', videoTitle: '武当功夫展示' },
  { id: '4', title: '热点响应内容审核', type: '审核', assignee: '张三', status: '已通过', priority: '中', dueDate: '昨天', videoTitle: '#武当山雪景' },
]

const statusColors: Record<string, string> = {
  '草稿': 'default',
  '审核中': 'processing',
  '修改中': 'warning',
  '待确认': 'processing',
  '已通过': 'success',
  '已发布': 'success',
  '已取消': 'default',
}

const priorityColors: Record<string, string> = {
  '高': 'error',
  '中': 'warning',
  '低': 'default',
}

export default function Tasks() {
  const [filter, setFilter] = useState({ status: '', priority: '', assignee: '' })

  const columns: ColumnsType<Task> = [
    {
      title: '任务标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          {record.videoTitle && <div><Text type="secondary" style={{ fontSize: 12 }}>关联: {record.videoTitle}</Text></div>}
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
    },
    {
      title: '负责人',
      dataIndex: 'assignee',
      key: 'assignee',
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
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority) => <Tag color={priorityColors[priority]}>{priority}</Tag>,
    },
    {
      title: '截止日期',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 100,
      render: (date) => (
        <Space>
          <ClockCircleOutlined />
          <Text type={date === '昨天' ? 'danger' : 'secondary'}>{date}</Text>
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: () => (
        <Dropdown menu={{ items: [
          { key: '1', label: '查看详情' },
          { key: '2', label: '编辑任务' },
          { key: '3', label: '流转状态' },
          { key: '4', label: '删除', danger: true },
        ]}}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>任务管理</Title>
        <Button type="primary" icon={<PlusOutlined />}>创建任务</Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Badge count={5}><Text strong>全部</Text></Badge>
          <Badge count={2}><Text type="secondary">我的任务</Text></Badge>
          <Badge count={1}><Text type="secondary">待审核</Text></Badge>
          <Badge count={1}><Text type="secondary">修改中</Text></Badge>
        </Space>
      </Card>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          <Select placeholder="全部状态" style={{ width: 120 }} allowClear>
            <Option value="draft">草稿</Option>
            <Option value="reviewing">审核中</Option>
            <Option value="revising">修改中</Option>
            <Option value="approved">已通过</Option>
          </Select>
          <Select placeholder="全部优先级" style={{ width: 120 }} allowClear>
            <Option value="high">高</Option>
            <Option value="medium">中</Option>
            <Option value="low">低</Option>
          </Select>
          <Select placeholder="全部负责人" style={{ width: 120 }} allowClear>
            <Option value="张三">张三</Option>
            <Option value="李四">李四</Option>
            <Option value="王五">王五</Option>
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={mockTasks}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}
