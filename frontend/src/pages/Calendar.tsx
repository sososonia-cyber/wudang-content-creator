import { useState } from 'react'
import { Calendar as AntCalendar, Card, Badge, Typography, Button, Modal, Form, Select, DatePicker, TimePicker, Input, message, Space, Tag } from 'antd'
import { PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select

interface CalendarEvent {
  id: string
  title: string
  date: string
  time?: string
  type: 'video' | 'publish' | 'task'
  status: 'pending' | 'completed'
}

const mockEvents: CalendarEvent[] = [
  { id: '1', title: '武当云海视频发布', date: '2026-03-14', time: '09:00', type: 'publish', status: 'pending' },
  { id: '2', title: '太极教学内容制作', date: '2026-03-15', type: 'video', status: 'pending' },
  { id: '3', title: '功夫展示视频审核', date: '2026-03-14', type: 'task', status: 'completed' },
  { id: '4', title: '抖音矩阵发布', date: '2026-03-16', time: '19:00', type: 'publish', status: 'pending' },
]

export default function Calendar() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())

  const getEventColor = (type: string) => {
    switch (type) {
      case 'video': return 'blue'
      case 'publish': return 'green'
      case 'task': return 'orange'
      default: return 'default'
    }
  }

  const dateCellRender = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD')
    const dayEvents = mockEvents.filter(e => e.date === dateStr)

    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {dayEvents.map(event => (
          <li key={event.id} style={{ marginBottom: 2 }}>
            <Badge
              color={getEventColor(event.type)}
              text={<Text style={{ fontSize: 12 }}>{event.title}</Text>}
            />
          </li>
        ))}
      </ul>
    )
  }

  const handleAddEvent = (values: any) => {
    console.log('添加日历项:', values)
    message.success('日历项添加成功')
    setIsModalOpen(false)
    form.resetFields()
  }

  const handleSelectDate = (date: Dayjs) => {
    setSelectedDate(date)
    const dateStr = date.format('YYYY-MM-DD')
    const dayEvents = mockEvents.filter(e => e.date === dateStr)
    
    if (dayEvents.length > 0) {
      Modal.info({
        title: `${dateStr} 的排期`,
        content: (
          <ul>
            {dayEvents.map(e => (
              <li key={e.id}>{e.time} {e.title} <Tag color={getEventColor(e.type)}>{e.type}</Tag></li>
            ))}
          </ul>
        ),
      })
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>内容日历</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          添加排期
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Badge color="blue" text="视频制作" />
            <Badge color="green" text="内容发布" />
            <Badge color="orange" text="任务节点" />
            <Text type="danger" style={{ marginLeft: 16 }}>
              <ExclamationCircleOutlined /> 3月14日有2个排期冲突
            </Text>
          </Space>
        </div>

        <AntCalendar
          cellRender={dateCellRender}
          onSelect={handleSelectDate}
        />
      </Card>

      <Modal
        title="添加排期"
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => setIsModalOpen(false)}
      >
        <Form form={form} layout="vertical" onFinish={handleAddEvent}>
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input placeholder="排期标题" />
          </Form.Item>
          
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select placeholder="选择类型">
              <Option value="video">视频制作</Option>
              <Option value="publish">内容发布</Option>
              <Option value="task">任务节点</Option>
            </Select>
          </Form.Item>

          <Form.Item name="date" label="日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="time" label="时间">
            <TimePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>

          <Form.Item name="videoId" label="关联视频">
            <Select placeholder="选择视频（可选）" allowClear>
              <Option value="1">武当山云海日出</Option>
              <Option value="2">太极拳入门教学</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
