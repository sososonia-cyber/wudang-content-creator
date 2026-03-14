import { Card, Form, Input, Button, Switch, Select, Divider, Typography, message, Tabs } from 'antd'
import { SaveOutlined } from '@ant-design/icons'

const { Title } = Typography
const { TabPane } = Tabs

export default function Settings() {
  const [form] = Form.useForm()

  const handleSave = () => {
    message.success('设置已保存')
  }

  return (
    <div>
      <Title level={4}>系统设置</Title>

      <Tabs defaultActiveKey="1">
        <TabPane tab="基础设置" key="1">
          <Card>
            <Form form={form} layout="vertical" onFinish={handleSave}>
              <Form.Item label="系统名称" name="systemName" initialValue="武当内容创作系统">
                <Input />
              </Form.Item>

              <Form.Item label="默认生成版本数" name="defaultVersions" initialValue={1}>
                <Select>
                  <Select.Option value={1}>1个版本</Select.Option>
                  <Select.Option value={3}>3个版本</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item label="视频最大时长(秒)" name="maxDuration" initialValue={60}>
                <Input type="number" />
              </Form.Item>

              <Form.Item label="启用热点预测" name="enablePrediction" valuePropName="checked" initialValue={true}>
                <Switch />
              </Form.Item>

              <Form.Item label="自动排期发布" name="autoSchedule" valuePropName="checked" initialValue={false}>
                <Switch />
              </Form.Item>

              <Form.Item>
                <Button type="primary" icon={<SaveOutlined />} htmlType="submit">
                  保存设置
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        <TabPane tab="API配置" key="2">
          <Card>
            <Form layout="vertical">
              <Form.Item label="Seedance API Key">
                <Input.Password placeholder="输入火山引擎API密钥" />
              </Form.Item>

              <Form.Item label="Qveris API Key">
                <Input.Password placeholder="输入Qveris API密钥" />
              </Form.Item>

              <Form.Item label="LLM API Key">
                <Input.Password placeholder="输入大模型API密钥" />
              </Form.Item>

              <Form.Item label="LLM Base URL" initialValue="https://dashscope.aliyuncs.com/compatible-mode/v1">
                <Input />
              </Form.Item>

              <Form.Item label="LLM Model" initialValue="qwen-plus">
                <Input />
              </Form.Item>

              <Form.Item>
                <Button type="primary" icon={<SaveOutlined />}>保存API配置</Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        <TabPane tab="平台配置" key="3">
          <Card>
            <Form layout="vertical">
              <Divider orientation="left">抖音</Divider>
              <Form.Item label="抖音账号ID">
                <Input placeholder="输入抖音账号ID" />
              </Form.Item>

              <Divider orientation="left">视频号</Divider>
              <Form.Item label="视频号ID">
                <Input placeholder="输入视频号ID" />
              </Form.Item>

              <Divider orientation="left">小红书</Divider>
              <Form.Item label="小红书账号">
                <Input placeholder="输入小红书账号" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" icon={<SaveOutlined />}>保存平台配置</Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        <TabPane tab="通知设置" key="4">
          <Card>
            <Form layout="vertical">
              <Form.Item label="飞书Webhook地址">
                <Input.TextArea rows={2} placeholder="输入飞书机器人Webhook地址" />
              </Form.Item>

              <Form.Item label="任务提醒" valuePropName="checked">
                <Switch defaultChecked />
              </Form.Item>

              <Form.Item label="热点提醒" valuePropName="checked">
                <Switch defaultChecked />
              </Form.Item>

              <Form.Item label="发布成功通知" valuePropName="checked">
                <Switch defaultChecked />
              </Form.Item>

              <Form.Item>
                <Button type="primary" icon={<SaveOutlined />}>保存通知设置</Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  )
}
